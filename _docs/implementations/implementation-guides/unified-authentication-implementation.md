# Unified Authentication System

This document explains how to use the unified authentication system implemented in the backoffice platform.

## Overview

The unified authentication system eliminates provider-specific authentication redundancy and enables seamless cross-app integration sharing through a multi-provider architecture. Users authenticate with Google as their primary provider (with @telegamez.com domain restriction) and can optionally connect secondary providers like GitHub for enhanced functionality.

## Multi-Provider Architecture

- **Primary Authentication**: Google OAuth with @telegamez.com domain restriction for secure access
- **Secondary Integrations**: Optional provider connections (GitHub, etc.) without affecting primary auth
- **Unified Token Management**: Centralized, encrypted storage for all provider tokens
- **Cross-App Data Sharing**: GitHub issues in AI Admin, Google Drive access across tools
- **Progressive Enhancement**: Add capabilities as needed without re-authentication
- **Centralized Management**: Single interface at `/integrations` for managing all connections

## Quick Start

### 1. Environment Setup

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

Generate an encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. OAuth Application Setup

#### Google OAuth Setup (Primary Authentication)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable Google Drive API, Gmail API, Calendar API
4. Create OAuth 2.0 credentials
5. Add your domain to authorized origins
6. Add your callback URL: `https://yourdomain.com/api/auth/callback/google`
7. Configure domain restriction for @telegamez.com (recommended)

#### GitHub OAuth Setup (Secondary Integration)
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL: `https://yourdomain.com/api/integrations/connect/github/callback`
4. Copy Client ID and Client Secret

**Note**: GitHub is connected as a secondary integration, not through NextAuth's primary flow.

### 3. Database Migration

The system requires additional database tables. Run migrations:

```bash
npm run db:migrate
```

## Usage Examples

### Adding Integration Requirements to an App

```typescript
// src/lib/applications.ts
export const applications: BackofficeApp[] = [
  {
    id: 'my-new-app',
    name: 'My New App',
    description: 'Description of the app',
    icon: 'AppIcon',
    path: '/apps/my-new-app',
    category: 'ai',
    enabled: true,
    integrations: {
      required: [
        {
          capability: 'google.drive',
          purpose: 'Access documents for analysis',
          fallback: 'disable',
          priority: 'required'
        }
      ],
      optional: [
        {
          capability: 'github.user_issues',
          purpose: 'Include developer tasks in context',
          fallback: 'limited',
          priority: 'optional'
        }
      ],
      provides: [
        {
          capability: 'my-app.analysis',
          dataType: 'analysis_result',
          endpoint: '/api/apps/my-new-app/analysis',
          permissions: ['read']
        }
      ]
    }
  }
];
```

### Using Integration Data in Your App

```typescript
// In your app component
import { integrationClient } from '@/lib/integrations/client';

// Get GitHub issues (requires secondary GitHub integration)
async function getGitHubIssuesForUser(userEmail: string) {
  return await integrationClient.getData({
    capability: 'github.user_issues',
    userEmail,
    requestingApp: 'my-new-app',
    cacheOptions: {
      enabled: true,
      ttl: 300 // 5 minutes
    }
  });
}

// Access Google services (available through primary auth)
async function getGoogleDriveFiles(userEmail: string) {
  return await integrationClient.getData({
    capability: 'google.drive',
    userEmail,
    requestingApp: 'my-new-app'
  });
}
```

### Integration Setup UI

```typescript
// In your app page
import { IntegrationSetup } from '@/components/integrations/IntegrationSetup';

export default function MyAppPage() {
  return (
    <div>
      <h1>My App</h1>
      <IntegrationSetup 
        appId="my-new-app"
        onIntegrationChange={(integrations) => {
          console.log('Integration status changed:', integrations);
        }}
        showOptional={true} // Show optional integrations like GitHub
      />
      
      {/* Quick link to centralized management */}
      <p className="text-sm mt-4">
        Manage all integrations at <a href="/integrations" className="text-blue-600 hover:underline">/integrations</a>
      </p>
    </div>
  );
}
```

### Checking Integration Status

```typescript
// Quick status indicator
import { IntegrationStatusIndicator } from '@/components/integrations/IntegrationSetup';

function AppHeader() {
  return (
    <div className="flex items-center gap-2">
      <h1>My App</h1>
      <IntegrationStatusIndicator 
        appId="my-new-app" 
        showDetails={true} 
      />
    </div>
  );
}
```

## API Endpoints

### Get Integration Status
```
GET /api/integrations/status?app=my-app-id
```

Returns integration status for a specific app:
```json
{
  "integrations": [
    {
      "capability": "google.drive",
      "name": "Google Drive",
      "description": "Access and analyze Google Drive documents",
      "purpose": "Access documents for analysis",
      "priority": "required",
      "available": true,
      "reason": "available",
      "lastUsed": "2025-08-13T10:30:00Z",
      "providerId": "google"
    },
    {
      "capability": "github.user_issues",
      "name": "GitHub Issues",
      "description": "Access user's GitHub issues",
      "purpose": "Include developer tasks in context",
      "priority": "optional",
      "available": false,
      "reason": "not_configured",
      "providerId": "github"
    }
  ]
}
```

### Connect Secondary Providers
```
GET /api/integrations/connect/github?callbackUrl=/integrations
```

Initiates OAuth flow for secondary provider (GitHub).

### Disconnect Secondary Providers  
```
POST /api/integrations/disconnect/github
```

Disconnects a secondary provider. Primary Google authentication cannot be disconnected through this endpoint.

### Cross-App Data Access
```
GET /api/integrations/github/user-issues
Headers: 
  X-User-Email: user@telegamez.com
  X-Requesting-App: my-app-id
```

Returns user's GitHub issues:
```json
{
  "issues": [
    {
      "id": 123456,
      "number": 42,
      "title": "Fix authentication bug",
      "repository": "owner/repo",
      "url": "https://github.com/owner/repo/issues/42",
      "updatedAt": "2025-08-13T10:30:00Z",
      "labels": ["bug", "high-priority"],
      "priority": "high"
    }
  ],
  "total": 5,
  "user": "github-username"
}
```

## Token Management

### Multi-Provider Token Architecture

The system handles tokens differently based on provider type:

**Primary Provider (Google)**:
- Managed through NextAuth.js session system
- Automatic token refresh via NextAuth callbacks
- Scopes configured at initial authentication
- Available immediately upon login

**Secondary Providers (GitHub)**:
- Stored independently in user_integrations table
- Manual connection/disconnection through dedicated endpoints
- Scopes requested during connection flow
- Optional - doesn't affect primary authentication

### Automatic Token Handling

The system automatically handles:
- Token encryption with AES-256-GCM for all providers
- Token refresh for Google OAuth (via NextAuth)
- GitHub token refresh (when refresh tokens are available)
- Scope validation for API requests
- Cross-app token sharing with proper isolation

### Manual Token Operations

```typescript
import { tokenManager } from '@/lib/integrations/token-manager';

// Get token for a secondary provider (GitHub)
const githubToken = await tokenManager.getProviderToken('user@telegamez.com', 'github');
// Returns null if token is corrupted/expired - user needs to reconnect

// Get Google token (from primary authentication)
const googleToken = await tokenManager.getProviderToken('user@telegamez.com', 'google');

// Check if user has required scopes for any provider
const hasGoogleScopes = await tokenManager.hasRequiredScopes(
  'user@telegamez.com', 
  'google', 
  ['https://www.googleapis.com/auth/drive.readonly']
);

// Get all user integrations (both primary and secondary)
const statuses = await tokenManager.getUserIntegrationStatus('user@telegamez.com');

// Revoke secondary provider (primary Google cannot be revoked this way)
// Note: Corrupted tokens are automatically removed when decryption fails
await tokenManager.revokeProviderToken('user@telegamez.com', 'github');
```

## Security Considerations

### Token Encryption
All tokens are encrypted using AES-256-GCM before storage with proper authentication tags. The encryption key must be 32 bytes (64 hex characters) and stored securely.

**Recent Security Fix (August 14, 2025)**:
- Fixed deprecated `crypto.createDecipher` usage
- Implemented proper GCM mode with authentication tags
- Added automatic cleanup of corrupted legacy tokens
- Users may need to reconnect secondary providers (GitHub) if they encounter token errors

### Cross-App Access Control
- Apps can only access capabilities they declare in their integration requirements
- User email validation ensures tokens aren't accessed by unauthorized users
- All access attempts are logged for audit trails

### Scope Validation
- Each capability defines required OAuth scopes
- System validates user has granted necessary permissions
- Automatic scope refresh when insufficient permissions detected

## Monitoring and Auditing

### Integration Usage Tracking
All integration usage is logged with:
- User email and requesting app
- Capability and operation type
- Success/failure status
- Response times and error details
- Timestamps for analysis

### Usage Analytics
```typescript
import { getIntegrationUsageStats } from '@/lib/integrations/audit';

const stats = await getIntegrationUsageStats('user@example.com', 30); // Last 30 days
```

## Troubleshooting

### Common Issues

#### "Capability not found"
- Ensure the capability is registered in the integration registry
- Check the capability ID matches exactly

#### "User not authenticated for provider"
- User needs to complete OAuth flow for the provider
- Check if token has expired and needs refresh
- **New**: Check if token was corrupted and automatically cleaned up

#### "Insufficient scopes"
- The user's current OAuth grants don't include required scopes
- User needs to re-authenticate with enhanced permissions

#### "Failed to decrypt token"
- **Common after August 14, 2025 security fix**: Legacy tokens using old encryption
- System automatically removes corrupted tokens
- User needs to reconnect the affected provider (usually GitHub)
- Go to `/integrations` page and reconnect the provider

#### "GitHub integration not connected" (but shows connected)
- Token was corrupted and automatically cleaned up
- Reconnect GitHub via "Manage Auth" button
- Check GitHub organization OAuth app approval if API returns 403

#### "Integration API error"
- Check the API endpoint is correctly implemented
- Verify the requesting app has permission for the capability

### Debug Mode

Set `NODE_ENV=development` to enable:
- Detailed logging of token operations
- Mock encryption for testing (not secure)
- Additional debug information in API responses

## Integration Management

### Centralized Integration Page

Users can manage all their integrations at `/integrations`:
- View connection status for all providers
- Connect/disconnect secondary providers (GitHub, etc.)
- See granted scopes and capabilities
- Monitor usage and expiration times
- Clear explanation of primary vs secondary authentication

### Provider Connection Flows

**Google (Primary)**:
1. User signs in through main authentication
2. Automatically grants Google Workspace access
3. Cannot be disconnected without signing out entirely
4. Domain restricted to @telegamez.com

**GitHub (Secondary)**:
1. User visits `/integrations` page
2. Clicks "Connect" for GitHub
3. Completes OAuth flow via dedicated endpoints
4. Can disconnect without affecting primary authentication
5. Optional - enhances functionality but not required

## Migration from Legacy Systems

### Multi-Provider Architecture Benefits

The new architecture eliminates the previous limitation where users could only use one OAuth method at a time:
- **Before**: Choose either Google OR GitHub for authentication
- **After**: Google for primary authentication AND GitHub for enhanced features

### Existing GitHub PATs
Legacy GitHub Personal Access Tokens are automatically migrated to the unified system when users first connect GitHub through the new secondary provider flow.

### Existing Google OAuth Tokens
Google tokens are now managed as the primary authentication provider. Users who were using separate Google OAuth implementations will automatically use the unified system.

### Migration Validation
```typescript
import { IntegrationMigration } from '@/lib/integrations/migration';

const migration = new IntegrationMigration();
await migration.migrateExistingTokens();
const isValid = await migration.validateMigration('user@example.com');
```

## Best Practices

1. **Graceful Degradation**: Always handle integration failures gracefully, especially for optional secondary providers
2. **Provider Hierarchy**: Understand that Google (primary) is always available, while secondary providers may not be connected
3. **Cache Wisely**: Use caching for frequently accessed data with appropriate TTLs
4. **Monitor Usage**: Track integration usage to identify bottlenecks
5. **Scope Minimization**: Only request the minimum scopes needed for each provider
6. **Error Handling**: Provide clear error messages distinguishing between primary and secondary provider issues
7. **User Education**: Make it clear which integrations are required vs optional
8. **Integration Management**: Direct users to `/integrations` for centralized provider management
9. **Security**: Never allow disconnection of primary authentication through secondary endpoints
10. **Token Security**: After security fixes, expect some users may need to reconnect secondary providers
11. **Organization OAuth**: Ensure GitHub organization has approved the OAuth app for repository access

## Adding New Secondary Providers

The system supports adding unlimited secondary OAuth providers following the established GitHub pattern. See the complete guide:

📋 **[Adding New OAuth Providers Guide](./adding-new-oauth-providers.md)**

### Quick Overview for New Providers

1. **Registry Configuration**: Add provider and capabilities to `IntegrationRegistry`
2. **OAuth Endpoints**: Create connection and callback handlers following GitHub pattern
3. **Data Access APIs**: Implement cross-app data sharing endpoints
4. **Application Integration**: Add provider capabilities to app requirements
5. **Environment Setup**: Configure OAuth credentials

### Supported Provider Examples
- ✅ **Google** (Primary Authentication - Always Required)
- ✅ **GitHub** (Secondary - Repository and issue access)
- 📝 **Discord** (Secondary - Server and channel access) - See guide for implementation
- 📝 **Slack** (Secondary - Workspace and channel access) - Follow same pattern
- 📝 **Microsoft** (Secondary - Teams and Office 365) - Follow same pattern

### Key Principles
- **Google remains primary**: Never disrupts main authentication
- **Independent secondary flows**: Each provider connects/disconnects independently  
- **Consistent patterns**: All secondary providers follow same OAuth flow structure
- **Automatic UI integration**: New providers appear automatically in `/integrations` page
- **Cross-app sharing**: Data from any connected provider available to authorized apps

## Contributing

When adding new integrations:

1. Follow the [Adding New OAuth Providers Guide](./adding-new-oauth-providers.md)
2. Add the provider to the integration registry with proper capabilities
3. Implement OAuth connection and callback endpoints following the GitHub pattern
4. Create cross-app data access APIs with proper validation
5. Add comprehensive tests for the integration
6. Update documentation with usage examples
7. Consider rate limits, error handling, and security requirements

For questions or issues, see the implementation status document or create an issue in the project repository.