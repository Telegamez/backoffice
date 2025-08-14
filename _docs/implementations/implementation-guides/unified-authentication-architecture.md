# Unified Authentication Architecture - Implementation Guide

**Date:** August 13, 2025  
**Version:** 1.0  
**Status:** Implementation Planning  
**Purpose:** Eliminate authentication redundancy and provide seamless cross-app integration experience

## Problem Statement

The current backoffice platform has multiple authentication flows for the same providers, creating poor user experience and technical complexity:

### Current Authentication Issues
- **Google OAuth Redundancy**: Users authenticate with Google for login, then separately for AI Admin Assistant APIs
- **GitHub Per-Tool Authentication**: Each tool (GitHub Timeline, future tools) requires separate GitHub setup
- **Token Duplication**: Multiple tokens stored for the same provider across different tools
- **Poor User Experience**: Multiple authentication steps for the same services
- **Technical Debt**: Scattered OAuth implementations and token management

### Goals
- **Single Authentication per Provider**: One Google OAuth, one GitHub authentication across all tools
- **Progressive Scope Enhancement**: Request additional permissions as needed without re-authentication
- **Shared Integration Registry**: Central management of all external service integrations
- **Cross-App Data Sharing**: GitHub issues in AI Admin, Google Drive access across tools
- **Unified User Experience**: Single setup, multiple benefits

## Unified Authentication Architecture

### Core Concepts

#### 1. Provider-Centric Authentication
Instead of app-specific authentication, organize by service provider:

```typescript
// Current (fragmented):
- Google OAuth (login) → backoffice access
- Google OAuth (AI Admin) → Drive/Gmail access  
- GitHub PAT (Timeline) → repo access
- GitHub PAT (Future Tool) → separate setup

// Unified (provider-centric):
- Google OAuth → login + all Google services
- GitHub OAuth → all GitHub features across tools
- Provider tokens shared across applications
```

#### 2. Progressive Scope Enhancement
Start with minimal scopes, enhance as needed:

```typescript
// Initial login scopes (minimal)
const loginScopes = ['openid', 'email', 'profile'];

// Enhanced scopes requested when accessing tools
const googleWorkspaceScopes = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/gmail.modify'
];

const githubScopes = ['repo:read', 'user:read'];
```

#### 3. Integration Registry
Central source of truth for all integrations:

```typescript
interface IntegrationProvider {
  id: string;                    // 'google', 'github'
  name: string;                  // 'Google Workspace', 'GitHub'
  authType: 'oauth2' | 'token';
  baseScopes: string[];          // Minimum required scopes
  capabilities: Capability[];    // What this provider offers
}

interface Capability {
  id: string;                    // 'google.drive', 'github.issues'
  requiredScopes: string[];      // Additional scopes needed
  sharedAcross: string[];        // Apps that can use this capability
}
```

### Implementation Strategy

#### Phase 1: Integration Registry Setup

**1.1 Create Central Registry**
```typescript
// /opt/factory/backoffice/src/lib/integrations/registry.ts
export class IntegrationRegistry {
  private providers = new Map<string, IntegrationProvider>();
  
  // Register all available providers
  registerProvider(provider: IntegrationProvider): void;
  
  // Get capabilities for an application
  getRequiredCapabilities(appId: string): Capability[];
  
  // Check if user has required integrations
  checkUserIntegrations(userEmail: string, appId: string): Promise<boolean>;
}
```

**1.2 Update Application Definitions**
```typescript
// /opt/factory/backoffice/src/lib/applications.ts
export interface BackofficeApp {
  // ... existing properties
  integrations?: {
    required: IntegrationRequirement[];    // Must have these
    optional: IntegrationRequirement[];    // Nice to have
    provides: IntegrationExport[];         // Exposes data to other apps
  };
}

// Example: AI Admin Assistant
{
  id: 'ai-admin-assistant',
  integrations: {
    required: [
      { capability: 'google.drive', purpose: 'Analyze documents' },
      { capability: 'google.gmail', purpose: 'Send emails' }
    ],
    optional: [
      { capability: 'github.user_issues', purpose: 'Include in daily summary' }
    ]
  }
}
```

#### Phase 2: Unified OAuth Implementation

**2.1 Enhanced NextAuth Configuration**
```typescript
// /opt/factory/backoffice/src/lib/auth.ts
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            'openid email profile',
            // Progressive enhancement - add scopes as needed
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/gmail.modify'
          ].join(' '),
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    }),
    // GitHub OAuth (instead of PAT)
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'repo:read user:read'
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Store provider tokens centrally
      if (account) {
        await saveProviderToken(
          token.email as string,
          account.provider,
          account.access_token!,
          account.scope?.split(' ') || []
        );
      }
      return token;
    }
  }
};
```

**2.2 Token Management**
```typescript
// /opt/factory/backoffice/src/lib/integrations/token-manager.ts
export class TokenManager {
  // Get token for specific provider
  async getProviderToken(userEmail: string, provider: string): Promise<string | null>;
  
  // Check if user has required scopes
  async hasRequiredScopes(userEmail: string, provider: string, scopes: string[]): Promise<boolean>;
  
  // Request additional scopes if needed
  async requestAdditionalScopes(userEmail: string, provider: string, scopes: string[]): Promise<void>;
  
  // Store token from OAuth callback
  async saveProviderToken(userEmail: string, provider: string, token: string, scopes: string[]): Promise<void>;
}
```

#### Phase 3: Cross-App Data Sharing

**3.1 Integration Client**
```typescript
// /opt/factory/backoffice/src/lib/integrations/client.ts
export class IntegrationClient {
  async getData<T>(request: {
    capability: string;          // 'github.user_issues'
    userEmail: string;
    requestingApp: string;       // 'ai-admin-assistant'
    parameters?: any;
  }): Promise<T | null> {
    // 1. Validate app has permission for this capability
    // 2. Check user has required provider authentication
    // 3. Make API call using shared token
    // 4. Return data or null if unavailable
  }
}
```

**3.2 Application Integration Examples**
```typescript
// AI Admin Assistant using GitHub data
export class AIAssistantGitHubIntegration {
  async getUserIssuesForDailySummary(userEmail: string): Promise<GitHubIssue[]> {
    try {
      return await integrationClient.getData<GitHubIssue[]>({
        capability: 'github.user_issues',
        userEmail,
        requestingApp: 'ai-admin-assistant'
      }) || [];
    } catch (error) {
      // Graceful degradation - this is optional integration
      console.warn('GitHub integration unavailable:', error);
      return [];
    }
  }
}

// GitHub Timeline sharing data with other apps
export class GitHubTimelineIntegration {
  async getTimelineEvents(userEmail: string): Promise<TimelineEvent[]> {
    // Implementation that other apps can access via API
  }
}
```

### User Experience Flow

#### 1. Initial Setup (One-Time)
```
User logs in with Google OAuth
├── Minimal scopes: email, profile
├── Backoffice access granted
└── Integration status: Basic authentication

User accesses AI Admin Assistant
├── App requires: google.drive, google.gmail
├── Check existing scopes → Missing scopes detected
├── Prompt: "Connect Google Workspace for document analysis"
├── Enhanced OAuth with additional scopes
└── Integration status: Google Workspace connected

User accesses GitHub Timeline
├── App requires: github.issues, github.repos
├── No GitHub authentication detected
├── Prompt: "Connect GitHub for repository data"
├── GitHub OAuth with required scopes
└── Integration status: GitHub connected

User returns to AI Admin Assistant
├── Optional integration: github.user_issues
├── GitHub already connected → Available automatically
├── Daily summary now includes GitHub issues
└── Cross-app integration working
```

#### 2. Integration Management UI
```typescript
// Integration status component shown in each app
<IntegrationStatus appId="ai-admin-assistant">
  <RequiredIntegration 
    name="Google Workspace" 
    status="connected" 
    capabilities={['Drive Access', 'Gmail Sending']}
  />
  <OptionalIntegration 
    name="GitHub" 
    status="connected" 
    capabilities={['User Issues']}
    benefit="Include development tasks in daily summary"
  />
</IntegrationStatus>
```

### Technical Implementation Details

#### Database Schema Updates
```sql
-- Enhanced user_integrations table
CREATE TABLE user_integrations (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  provider_id VARCHAR(50) NOT NULL,           -- 'google', 'github'
  credentials_encrypted TEXT NOT NULL,        -- OAuth tokens, encrypted
  scopes TEXT[] NOT NULL,                     -- Granted scopes
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  last_used TIMESTAMP,
  UNIQUE(user_email, provider_id)
);

-- Integration usage tracking
CREATE TABLE integration_usage (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  provider_id VARCHAR(50) NOT NULL,
  capability VARCHAR(100) NOT NULL,           -- 'google.drive', 'github.issues'
  requesting_app VARCHAR(50) NOT NULL,        -- 'ai-admin-assistant'
  success BOOLEAN NOT NULL,
  response_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### API Endpoints
```typescript
// Get integration status for an app
GET /api/integrations/status?app=ai-admin-assistant
Response: {
  integrations: [
    {
      provider: 'google',
      status: 'connected',
      capabilities: ['drive', 'gmail'],
      lastUsed: '2025-08-13T10:30:00Z'
    },
    {
      provider: 'github',
      status: 'available',        // Connected but not required
      capabilities: ['user_issues'],
      lastUsed: null
    }
  ]
}

// Cross-app data access
GET /api/integrations/github/user-issues
Headers: X-Requesting-App: ai-admin-assistant
Response: {
  issues: [...],
  total: 15
}
```

### Security Considerations

#### Token Encryption (Fixed August 14, 2025)
```typescript
// Proper AES-256-GCM encryption with authentication tags
export class TokenEncryption {
  encrypt(token: string): string {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    
    return JSON.stringify({
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    });
  }
  
  decrypt(encryptedData: string): string {
    const key = getEncryptionKey();
    const data = JSON.parse(encryptedData);
    const iv = Buffer.from(data.iv, 'hex');
    const tag = Buffer.from(data.tag, 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

**Security Fix Summary:**
- Replaced deprecated `crypto.createDecipher` with proper `crypto.createDecipheriv`
- Implemented GCM authentication tags to prevent token tampering
- Added automatic cleanup of corrupted legacy tokens
- Users may need to reconnect secondary providers after the fix

#### Cross-App Access Control
```typescript
// Validate app permissions before data access
export async function validateAppAccess(
  requestingApp: string,
  capability: string,
  userEmail: string
): Promise<boolean> {
  // 1. Check if app declares this capability in its requirements
  // 2. Verify user has granted necessary provider permissions
  // 3. Log access attempt for audit trail
  return hasAccess;
}
```

#### Audit Logging
```typescript
interface IntegrationAuditLog {
  userEmail: string;
  action: 'token_grant' | 'data_access' | 'scope_request';
  provider: string;
  requestingApp: string;
  success: boolean;
  ipAddress: string;
  timestamp: Date;
}
```

### Migration Strategy

#### Phase 1: Backward Compatibility
- Keep existing authentication methods working
- Add unified system alongside existing implementations
- Users can opt-in to unified approach

#### Phase 2: Gradual Migration
- New users automatically use unified system
- Existing users prompted to migrate when accessing new features
- Clear migration benefits communication

#### Phase 3: Legacy Cleanup
- Remove old authentication implementations
- Consolidate all users on unified system
- Clean up redundant database tables and code

### Benefits Realization

#### For Users
- **Single Setup**: One GitHub connection works across all tools
- **Seamless Experience**: No repeated authentication for same services
- **Enhanced Features**: Cross-app data sharing (GitHub issues in AI summaries)
- **Better Security**: Centralized token management and revocation

#### For Development
- **Reduced Complexity**: Single OAuth implementation per provider
- **Faster Feature Development**: Reuse existing integrations
- **Better Maintainability**: Central token and scope management
- **Consistent Error Handling**: Unified API client and rate limiting

#### For Platform
- **Scalable Architecture**: Easy addition of new providers and apps
- **Better Analytics**: Unified integration usage tracking
- **Improved Security**: Centralized audit logging and access control
- **Cost Optimization**: Shared API quotas and connection pooling

## Implementation Timeline

### Week 1-2: Foundation
- Create integration registry system
- Update application definitions with integration requirements
- Design database schema for unified token storage

### Week 3-4: OAuth Integration
- Enhance NextAuth configuration for multiple providers
- Implement token management and encryption
- Create cross-app data access APIs

### Week 5-6: User Interface
- Build integration management components
- Create app-specific integration status displays
- Implement OAuth flow improvements

### Week 7-8: Testing & Migration
- Test cross-app data sharing scenarios
- Create migration path for existing users
- Performance testing and optimization

## Extending the Architecture

### Adding New Secondary Providers

The architecture supports unlimited secondary providers following the established GitHub pattern:

```typescript
// Pattern for any new provider (Discord, Slack, Microsoft, etc.)
1. Registry Configuration → Add provider and capabilities
2. OAuth Endpoints → /api/integrations/connect/{provider}/
3. Data APIs → /api/integrations/{provider}/{capability}/
4. Application Integration → Add to app requirements
5. Automatic UI → Appears in /integrations page
```

**Complete Guide**: See [Adding New OAuth Providers](./adding-new-oauth-providers.md) for detailed implementation instructions.

### Scalability Benefits

- **Unlimited Secondary Providers**: Add Discord, Slack, Microsoft, etc. without affecting primary auth
- **Cross-App Data Sharing**: Any connected provider's data available to all authorized apps
- **Consistent User Experience**: Same connection flow for all secondary providers
- **Zero Primary Auth Impact**: Secondary providers never disrupt Google authentication
- **Automatic Management**: New providers automatically appear in centralized `/integrations` page

This unified authentication architecture provides a solid foundation for eliminating authentication redundancy while enabling powerful cross-app integration capabilities. The phased approach ensures backward compatibility during migration while delivering immediate benefits to users and developers.