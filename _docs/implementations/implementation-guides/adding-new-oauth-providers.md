# Adding New Secondary OAuth Providers

**Date:** August 14, 2025  
**Version:** 1.0  
**Purpose:** Guide for adding new secondary OAuth providers (Discord, Slack, etc.) following the established GitHub pattern

## Overview

This guide shows how to add new secondary OAuth providers to the unified authentication system. The architecture maintains Google as the primary authentication provider while allowing multiple secondary providers for enhanced functionality.

## Architecture Pattern

### Primary vs Secondary Providers

```typescript
// Primary Authentication (Required - Cannot be disconnected)
Google OAuth → Login + Google Workspace access
├── Domain restriction: @telegames.ai
├── Managed by NextAuth.js
├── Required for platform access
└── Provides: Drive, Gmail, Calendar access

// Secondary Integrations (Optional - Can be connected/disconnected)
GitHub OAuth → Repository and issue access
Discord OAuth → Server and channel access  
Slack OAuth → Workspace and message access
├── Independent OAuth flows
├── Stored in user_integrations table
├── Optional enhancements
└── Do not affect primary authentication
```

## Adding Discord as Secondary Provider

### Step 1: Registry Configuration

First, add Discord to the integration registry:

```typescript
// src/lib/integrations/registry.ts
import { IntegrationProvider, IntegrationCapability } from './types';

// Add Discord capabilities
const discordCapabilities: IntegrationCapability[] = [
  {
    id: 'discord.guilds',
    name: 'Discord Servers',
    description: 'Access user\'s Discord servers',
    requiredScopes: ['guilds'],
    dependencies: [],
    dataType: 'guild_list',
    rateLimit: { requests: 30, window: 60 }
  },
  {
    id: 'discord.user_info',
    name: 'Discord User Info',
    description: 'Access Discord user profile',
    requiredScopes: ['identify'],
    dependencies: [],
    dataType: 'user_profile',
    rateLimit: { requests: 10, window: 60 }
  },
  {
    id: 'discord.messages',
    name: 'Discord Messages',
    description: 'Access Discord channel messages',
    requiredScopes: ['guilds', 'guilds.members.read'],
    dependencies: ['discord.guilds'],
    dataType: 'message_list',
    rateLimit: { requests: 50, window: 60 }
  }
];

// Add Discord provider
const discordProvider: IntegrationProvider = {
  id: 'discord',
  name: 'Discord',
  description: 'Access Discord servers and messages',
  authType: 'oauth2',
  baseUrl: 'https://discord.com/api/v10',
  capabilities: discordCapabilities,
  endpoints: {
    authorize: 'https://discord.com/api/oauth2/authorize',
    token: 'https://discord.com/api/oauth2/token',
    revoke: 'https://discord.com/api/oauth2/token/revoke',
    userInfo: 'https://discord.com/api/users/@me'
  },
  requiredEnvVars: ['DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET'],
  documentation: 'https://discord.com/developers/docs/topics/oauth2'
};

// Register the provider
export class IntegrationRegistry {
  constructor() {
    this.registerProvider(googleProvider);
    this.registerProvider(githubProvider);
    this.registerProvider(discordProvider); // Add Discord
  }
}
```

### Step 2: Environment Configuration

Add Discord OAuth credentials to your environment:

```bash
# .env.local
# Discord OAuth (Secondary Provider)
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
```

### Step 3: OAuth Connection Endpoint

Create the Discord connection initiation endpoint:

```typescript
// src/app/api/integrations/connect/discord/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized - please sign in first' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const callbackUrl = searchParams.get('callbackUrl') || '/integrations';

    // Discord OAuth parameters
    const discordAuthUrl = new URL('https://discord.com/api/oauth2/authorize');
    discordAuthUrl.searchParams.set('client_id', process.env.DISCORD_CLIENT_ID!);
    discordAuthUrl.searchParams.set('response_type', 'code');
    discordAuthUrl.searchParams.set('scope', 'identify guilds');
    
    // IMPORTANT: Use the correct callback URL for your domain
    discordAuthUrl.searchParams.set('redirect_uri', `https://backoffice.telegames.ai/api/integrations/connect/discord/callback`);
    
    // State for security and callback handling
    const state = JSON.stringify({
      userEmail: session.user.email,
      callbackUrl,
      timestamp: Date.now()
    });
    discordAuthUrl.searchParams.set('state', state);

    return NextResponse.redirect(discordAuthUrl.toString());
  } catch (error) {
    console.error('Discord connection error:', error);
    return NextResponse.json({ error: 'Failed to initiate Discord connection' }, { status: 500 });
  }
}
```

### Step 4: OAuth Callback Handler

Create the Discord OAuth callback handler:

```typescript
// src/app/api/integrations/connect/discord/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { tokenManager } from '@/lib/integrations/token-manager';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized - session expired' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      const callbackUrl = '/integrations?error=' + encodeURIComponent(error);
      return NextResponse.redirect(new URL(callbackUrl, 'https://backoffice.telegames.ai'));
    }

    if (!code) {
      const callbackUrl = '/integrations?error=no_code';
      return NextResponse.redirect(new URL(callbackUrl, 'https://backoffice.telegames.ai'));
    }

    let parsedState;
    try {
      parsedState = JSON.parse(state || '{}');
    } catch {
      const callbackUrl = '/integrations?error=invalid_state';
      return NextResponse.redirect(new URL(callbackUrl, 'https://backoffice.telegames.ai'));
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: `https://backoffice.telegames.ai/api/integrations/connect/discord/callback`,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error || !tokenData.access_token) {
      const callbackUrl = '/integrations?error=token_exchange_failed';
      return NextResponse.redirect(new URL(callbackUrl, 'https://backoffice.telegames.ai'));
    }

    // Get user information to verify the connection
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      const callbackUrl = '/integrations?error=user_fetch_failed';
      return NextResponse.redirect(new URL(callbackUrl, 'https://backoffice.telegames.ai'));
    }

    const userData = await userResponse.json();

    // Store the Discord token using unified token manager
    await tokenManager.saveProviderToken(
      session.user.email,
      'discord',
      tokenData.access_token,
      tokenData.refresh_token || null,
      tokenData.scope?.split(' ') || ['identify', 'guilds'],
      tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : undefined
    );

    // Redirect back with success
    const callbackUrl = parsedState.callbackUrl || '/integrations';
    const successUrl = `${callbackUrl}?integration=discord&status=connected&user=${encodeURIComponent(userData.username)}`;
    
    return NextResponse.redirect(new URL(successUrl, 'https://backoffice.telegames.ai'));

  } catch (error) {
    console.error('Discord callback error:', error);
    const callbackUrl = '/integrations?error=callback_failed';
    return NextResponse.redirect(new URL(callbackUrl, 'https://backoffice.telegames.ai'));
  }
}
```

### Step 5: Cross-App Data Access API

Create API endpoints for cross-app Discord data access:

```typescript
// src/app/api/integrations/discord/user-guilds/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { tokenManager } from '@/lib/integrations/token-manager';
import { validateAppAccess } from '@/lib/integrations/validation';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestingApp = req.headers.get('X-Requesting-App');
    if (!requestingApp) {
      return NextResponse.json({ error: 'Missing X-Requesting-App header' }, { status: 400 });
    }

    // Validate app has permission to access Discord guilds
    const hasAccess = await validateAppAccess(requestingApp, 'discord.guilds', session.user.email);
    if (!hasAccess) {
      return NextResponse.json({ error: 'App not authorized for Discord guild access' }, { status: 403 });
    }

    // Get Discord token
    const discordToken = await tokenManager.getProviderToken(session.user.email, 'discord');
    if (!discordToken) {
      return NextResponse.json({ error: 'Discord not connected' }, { status: 404 });
    }

    // Fetch user's Discord guilds
    const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: {
        'Authorization': `Bearer ${discordToken}`,
      },
    });

    if (!guildsResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch Discord guilds' }, { status: 500 });
    }

    const guilds = await guildsResponse.json();

    return NextResponse.json({
      guilds: guilds.map((guild: any) => ({
        id: guild.id,
        name: guild.name,
        icon: guild.icon,
        owner: guild.owner,
        permissions: guild.permissions
      })),
      total: guilds.length
    });

  } catch (error) {
    console.error('Discord guilds API error:', error);
    return NextResponse.json({ error: 'Failed to fetch Discord guilds' }, { status: 500 });
  }
}
```

### Step 6: Application Integration

Add Discord to your application's integration requirements:

```typescript
// src/lib/applications.ts
export const applications: BackofficeApp[] = [
  {
    id: 'discord-community-manager',
    name: 'Discord Community Manager',
    description: 'Manage Discord communities and moderate channels',
    icon: 'MessageSquare',
    path: '/apps/discord-community-manager',
    category: 'communication',
    enabled: true,
    integrations: {
      required: [
        {
          capability: 'discord.guilds',
          purpose: 'Access Discord servers for management',
          fallback: 'disable',
          priority: 'required'
        }
      ],
      optional: [
        {
          capability: 'discord.messages',
          purpose: 'Read channel messages for moderation',
          fallback: 'limited',
          priority: 'optional'
        }
      ]
    }
  }
];
```

### Step 7: Using Discord Integration in Your App

```typescript
// src/app/apps/discord-community-manager/page.tsx
import { integrationClient } from '@/lib/integrations/client';
import { IntegrationSetup } from '@/components/integrations/IntegrationSetup';

export default function DiscordCommunityManager() {
  const [guilds, setGuilds] = useState([]);
  const [integrationReady, setIntegrationReady] = useState(false);

  // Check integration status on mount
  useEffect(() => {
    const checkIntegrationStatus = async () => {
      try {
        const response = await fetch('/api/integrations/status?app=discord-community-manager');
        const data = await response.json();
        
        const discordIntegration = data.integrations?.find(
          (integration: any) => integration.capability.startsWith('discord.')
        );
        
        setIntegrationReady(discordIntegration?.available || false);
      } catch (error) {
        console.error('Failed to check integration status:', error);
        setIntegrationReady(false);
      }
    };

    checkIntegrationStatus();
  }, []);

  // Load Discord guilds
  const loadGuilds = async () => {
    if (!integrationReady) return;

    try {
      const guildsData = await integrationClient.getData({
        capability: 'discord.guilds',
        userEmail: session?.user?.email,
        requestingApp: 'discord-community-manager'
      });

      setGuilds(guildsData?.guilds || []);
    } catch (error) {
      console.error('Failed to load Discord guilds:', error);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Discord Community Manager</h1>
        <Button 
          variant="outline" 
          onClick={() => window.location.href = '/integrations'}
        >
          Manage Auth
        </Button>
      </header>

      {/* Integration setup */}
      <IntegrationSetup 
        appId="discord-community-manager"
        onIntegrationChange={(integrations) => {
          const discordReady = integrations.some(i => 
            i.capability.startsWith('discord.') && i.available
          );
          setIntegrationReady(discordReady);
        }}
        showOptional={true}
      />

      {/* App content */}
      {integrationReady ? (
        <div className="mt-6">
          <Button onClick={loadGuilds}>Load Discord Servers</Button>
          {/* Display guilds */}
        </div>
      ) : (
        <div className="mt-6 text-center text-muted-foreground">
          Connect Discord to manage your servers
        </div>
      )}
    </div>
  );
}
```

## Integration Management UI

The existing `/integrations` page automatically supports new secondary providers:

```typescript
// The IntegrationsPage component will automatically display Discord
// alongside GitHub and other secondary providers:

function IntegrationsPage() {
  return (
    <div>
      {/* Primary Authentication (Google) */}
      <PrimaryAuthSection />
      
      {/* Secondary Integrations */}
      <SecondaryIntegrationsSection>
        <ProviderCard provider="github" />
        <ProviderCard provider="discord" />  {/* Automatically included */}
        <ProviderCard provider="slack" />     {/* When added */}
      </SecondaryIntegrationsSection>
    </div>
  );
}
```

## Discord OAuth App Setup

### 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Name it "Telegamez Backoffice" or similar
4. Navigate to "OAuth2" tab

### 2. Configure OAuth2 Settings

```
Client ID: [Copy this to your .env]
Client Secret: [Copy this to your .env]

Redirects:
- https://backoffice.telegames.ai/api/integrations/connect/discord/callback
- http://localhost:3000/api/integrations/connect/discord/callback (for development)

Scopes:
- identify (required)
- guilds (for server access)
- guilds.members.read (for member information)
```

### 3. Bot Configuration (if needed)

If your app needs bot functionality:

```
Bot Token: [Store securely, different from OAuth]
Bot Permissions:
- Read Messages
- Send Messages
- Manage Messages
- etc.
```

## Adding More Secondary Providers

### Slack Example

Follow the same pattern for Slack:

```typescript
// 1. Add to registry
const slackProvider: IntegrationProvider = {
  id: 'slack',
  name: 'Slack',
  description: 'Access Slack workspaces and channels',
  authType: 'oauth2',
  baseUrl: 'https://slack.com/api',
  capabilities: [
    {
      id: 'slack.channels',
      name: 'Slack Channels',
      description: 'Access Slack channels',
      requiredScopes: ['channels:read'],
      dependencies: [],
      dataType: 'channel_list',
      rateLimit: { requests: 20, window: 60 }
    }
  ],
  endpoints: {
    authorize: 'https://slack.com/oauth/v2/authorize',
    token: 'https://slack.com/api/oauth.v2.access',
    userInfo: 'https://slack.com/api/auth.test'
  },
  requiredEnvVars: ['SLACK_CLIENT_ID', 'SLACK_CLIENT_SECRET']
};

// 2. Create connection endpoint: /api/integrations/connect/slack/route.ts
// 3. Create callback handler: /api/integrations/connect/slack/callback/route.ts  
// 4. Create data access API: /api/integrations/slack/channels/route.ts
// 5. Add to application requirements
```

## Best Practices for Secondary Providers

### 1. Consistent Pattern
Always follow the established GitHub pattern:
- Connection endpoint: `/api/integrations/connect/{provider}/route.ts`
- Callback handler: `/api/integrations/connect/{provider}/callback/route.ts`
- Data APIs: `/api/integrations/{provider}/{capability}/route.ts`

### 2. Error Handling
```typescript
// Always redirect errors to /integrations page
const callbackUrl = '/integrations?error=' + encodeURIComponent(errorType);
return NextResponse.redirect(new URL(callbackUrl, 'https://backoffice.telegames.ai'));
```

### 3. State Management
```typescript
// Include security and callback information in state
const state = JSON.stringify({
  userEmail: session.user.email,
  callbackUrl,
  timestamp: Date.now(),
  nonce: crypto.randomBytes(16).toString('hex') // Additional security
});
```

### 4. Scope Management
```typescript
// Start with minimal scopes, enhance as needed
const baseScopes = ['identify']; // Minimal for connection
const enhancedScopes = ['identify', 'guilds', 'guilds.members.read']; // For full functionality
```

### 5. Token Security
- All tokens are automatically encrypted with AES-256-GCM
- Use the unified `tokenManager` for all operations
- Never store tokens in plain text

## Testing Secondary Providers

### 1. Development Setup
```bash
# Use localhost callback URLs for testing
DISCORD_REDIRECT_URI=http://localhost:3000/api/integrations/connect/discord/callback
```

### 2. Integration Testing
```typescript
// Test the complete flow
describe('Discord Integration', () => {
  it('should connect Discord successfully', async () => {
    // 1. Initiate connection
    // 2. Mock OAuth callback
    // 3. Verify token storage
    // 4. Test data access
  });
});
```

### 3. Production Validation
1. Update OAuth app redirect URIs for production domain
2. Test with real OAuth flows
3. Verify organization/server permissions
4. Test token refresh (if supported by provider)

## Monitoring & Analytics

### Track Integration Usage
```typescript
// Automatic logging for all secondary providers
interface IntegrationUsage {
  userEmail: string;
  provider: 'discord' | 'slack' | 'github';
  capability: string;
  requestingApp: string;
  success: boolean;
  responseTime: number;
  timestamp: Date;
}
```

### Performance Monitoring
```typescript
// Monitor API response times for each provider
const providers = ['github', 'discord', 'slack'];
providers.forEach(provider => {
  monitor.track(`integration.${provider}.response_time`);
  monitor.track(`integration.${provider}.success_rate`);
});
```

This pattern provides a scalable foundation for adding any number of secondary OAuth providers while maintaining Google as the primary authentication provider and ensuring consistent user experience across all integrations.