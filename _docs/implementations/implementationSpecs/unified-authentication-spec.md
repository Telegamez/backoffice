# Unified Authentication Implementation Specification

**Document Version:** 1.0  
**Date:** August 13, 2025  
**Implementation Priority:** High  
**Estimated Effort:** 6-8 weeks  
**Dependencies:** Shared Integrations Architecture

## Overview

This specification details the technical implementation of unified authentication across the backoffice platform, eliminating provider-specific authentication redundancy and enabling seamless cross-application integration sharing.

## Technical Requirements

### 1. Integration Registry System

#### 1.1 Core Data Structures

```typescript
// src/lib/integrations/types.ts
export interface IntegrationProvider {
  id: string;                          // 'google', 'github', 'microsoft'
  name: string;                        // 'Google Workspace', 'GitHub'
  version: string;                     // '1.0.0'
  authType: 'oauth2' | 'token' | 'service_account';
  baseScopes: string[];                // Required scopes for basic functionality
  capabilities: IntegrationCapability[];
  endpoints: {
    auth?: string;                     // OAuth authorization URL
    token?: string;                    // Token exchange URL
    revoke?: string;                   // Token revocation URL
  };
  rateLimit: {
    requests: number;                  // Requests per window
    window: number;                    // Time window in seconds
    burst?: number;                    // Burst allowance
  };
  status: 'active' | 'maintenance' | 'deprecated';
}

export interface IntegrationCapability {
  id: string;                          // 'google.drive', 'github.issues'
  providerId: string;                  // Parent provider ID
  name: string;                        // Human readable name
  description: string;                 // Purpose and functionality
  dataTypes: string[];                 // ['document', 'email', 'issue']
  operations: ('read' | 'write' | 'sync')[];
  requiredScopes: string[];            // Additional scopes beyond base
  dependencies?: string[];             // Other capabilities this depends on
  apiEndpoint?: string;                // Cross-app access endpoint
}

export interface IntegrationRequirement {
  capability: string;                  // Reference to capability ID
  purpose: string;                     // Why this app needs this capability
  fallback: 'disable' | 'limited' | 'error'; // Behavior when unavailable
  priority: 'required' | 'optional';
}

export interface IntegrationExport {
  capability: string;                  // What capability this app provides
  dataType: string;                    // Type of data exposed
  endpoint: string;                    // API endpoint for access
  permissions: string[];               // Who can access this
}
```

#### 1.2 Registry Implementation

```typescript
// src/lib/integrations/registry.ts
export class IntegrationRegistry {
  private static instance: IntegrationRegistry;
  private providers = new Map<string, IntegrationProvider>();
  private capabilities = new Map<string, IntegrationCapability>();

  static getInstance(): IntegrationRegistry {
    if (!IntegrationRegistry.instance) {
      IntegrationRegistry.instance = new IntegrationRegistry();
      IntegrationRegistry.instance.initializeProviders();
    }
    return IntegrationRegistry.instance;
  }

  private initializeProviders(): void {
    // Register Google Workspace provider
    this.registerProvider({
      id: 'google',
      name: 'Google Workspace',
      version: '1.0.0',
      authType: 'oauth2',
      baseScopes: ['openid', 'email', 'profile'],
      endpoints: {
        auth: 'https://accounts.google.com/o/oauth2/v2/auth',
        token: 'https://oauth2.googleapis.com/token',
        revoke: 'https://oauth2.googleapis.com/revoke'
      },
      rateLimit: {
        requests: 1000,
        window: 100,    // 1000 requests per 100 seconds
        burst: 100
      },
      status: 'active',
      capabilities: [
        {
          id: 'google.drive',
          providerId: 'google',
          name: 'Google Drive',
          description: 'Access and analyze Google Drive documents',
          dataTypes: ['document', 'file', 'folder'],
          operations: ['read'],
          requiredScopes: ['https://www.googleapis.com/auth/drive.readonly'],
          apiEndpoint: '/api/integrations/google/drive'
        },
        {
          id: 'google.gmail',
          providerId: 'google', 
          name: 'Gmail',
          description: 'Send and manage Gmail messages',
          dataTypes: ['email', 'draft', 'thread'],
          operations: ['read', 'write'],
          requiredScopes: ['https://www.googleapis.com/auth/gmail.modify'],
          apiEndpoint: '/api/integrations/google/gmail'
        },
        {
          id: 'google.calendar',
          providerId: 'google',
          name: 'Google Calendar',
          description: 'Access calendar events and scheduling',
          dataTypes: ['event', 'calendar'],
          operations: ['read'],
          requiredScopes: ['https://www.googleapis.com/auth/calendar.readonly'],
          apiEndpoint: '/api/integrations/google/calendar'
        }
      ]
    });

    // Register GitHub provider
    this.registerProvider({
      id: 'github',
      name: 'GitHub',
      version: '1.0.0',
      authType: 'oauth2',
      baseScopes: ['user:email'],
      endpoints: {
        auth: 'https://github.com/login/oauth/authorize',
        token: 'https://github.com/login/oauth/access_token'
      },
      rateLimit: {
        requests: 5000,
        window: 3600,   // 5000 requests per hour
        burst: 100
      },
      status: 'active',
      capabilities: [
        {
          id: 'github.repos',
          providerId: 'github',
          name: 'Repository Access',
          description: 'Access repository information and content',
          dataTypes: ['repository', 'commit', 'branch'],
          operations: ['read'],
          requiredScopes: ['repo'],
          apiEndpoint: '/api/integrations/github/repos'
        },
        {
          id: 'github.issues',
          providerId: 'github',
          name: 'Issues Access',
          description: 'Access repository issues and pull requests',
          dataTypes: ['issue', 'pull_request'],
          operations: ['read'],
          requiredScopes: ['repo'],
          apiEndpoint: '/api/integrations/github/issues'
        },
        {
          id: 'github.user_issues',
          providerId: 'github',
          name: 'User Issues',
          description: 'Get issues assigned to the authenticated user',
          dataTypes: ['user_issue'],
          operations: ['read'],
          requiredScopes: ['repo', 'user:read'],
          dependencies: ['github.issues'],
          apiEndpoint: '/api/integrations/github/user-issues'
        }
      ]
    });
  }

  registerProvider(provider: IntegrationProvider): void {
    this.providers.set(provider.id, provider);
    
    // Index capabilities for quick lookup
    provider.capabilities.forEach(capability => {
      this.capabilities.set(capability.id, capability);
    });
  }

  getProvider(id: string): IntegrationProvider | undefined {
    return this.providers.get(id);
  }

  getCapability(id: string): IntegrationCapability | undefined {
    return this.capabilities.get(id);
  }

  getAllProviders(): IntegrationProvider[] {
    return Array.from(this.providers.values());
  }

  getProviderCapabilities(providerId: string): IntegrationCapability[] {
    const provider = this.providers.get(providerId);
    return provider?.capabilities || [];
  }

  findCapabilitiesByDataType(dataType: string): IntegrationCapability[] {
    return Array.from(this.capabilities.values())
      .filter(capability => capability.dataTypes.includes(dataType));
  }
}

// Export singleton instance
export const registry = IntegrationRegistry.getInstance();
```

### 2. Database Schema

#### 2.1 User Integrations Table

```sql
-- Enhanced user integrations storage
CREATE TABLE user_integrations (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  provider_id VARCHAR(50) NOT NULL,
  credentials_encrypted TEXT NOT NULL,        -- Encrypted OAuth tokens/keys
  scopes TEXT[] NOT NULL DEFAULT '{}',        -- Granted OAuth scopes
  metadata JSONB DEFAULT '{}',                -- Provider-specific metadata
  expires_at TIMESTAMP,                       -- Token expiration (if applicable)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used TIMESTAMP,
  
  -- Ensure one integration per user per provider
  UNIQUE(user_email, provider_id)
);

-- Performance indexes
CREATE INDEX idx_user_integrations_user_email ON user_integrations(user_email);
CREATE INDEX idx_user_integrations_provider ON user_integrations(provider_id);
CREATE INDEX idx_user_integrations_expires ON user_integrations(expires_at) WHERE expires_at IS NOT NULL;
```

#### 2.2 Integration Usage Tracking

```sql
-- Track cross-app integration usage
CREATE TABLE integration_usage (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  provider_id VARCHAR(50) NOT NULL,
  capability VARCHAR(100) NOT NULL,
  requesting_app VARCHAR(50) NOT NULL,
  operation VARCHAR(20) NOT NULL,              -- 'read', 'write', 'sync'
  success BOOLEAN NOT NULL,
  response_time_ms INTEGER,
  error_code VARCHAR(50),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Partitioning by month for performance
CREATE TABLE integration_usage_y2025m08 PARTITION OF integration_usage
  FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');

-- Performance indexes
CREATE INDEX idx_integration_usage_user_time ON integration_usage(user_email, created_at DESC);
CREATE INDEX idx_integration_usage_provider_time ON integration_usage(provider_id, created_at DESC);
CREATE INDEX idx_integration_usage_app_time ON integration_usage(requesting_app, created_at DESC);
```

#### 2.3 Integration Permissions

```sql
-- Control which apps can access which capabilities
CREATE TABLE integration_permissions (
  id SERIAL PRIMARY KEY,
  app_id VARCHAR(50) NOT NULL,
  capability VARCHAR(100) NOT NULL,
  permission_level VARCHAR(20) NOT NULL,       -- 'read', 'write', 'admin'
  auto_approved BOOLEAN DEFAULT FALSE,         -- Skip user consent
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(app_id, capability)
);

-- Pre-populate with current app requirements
INSERT INTO integration_permissions (app_id, capability, permission_level, auto_approved) VALUES
  ('ai-admin-assistant', 'google.drive', 'read', TRUE),
  ('ai-admin-assistant', 'google.gmail', 'write', TRUE),
  ('ai-admin-assistant', 'github.user_issues', 'read', TRUE),
  ('github-timeline', 'github.repos', 'read', TRUE),
  ('github-timeline', 'github.issues', 'read', TRUE);
```

### 3. Authentication Implementation

#### 3.1 Enhanced NextAuth Configuration

```typescript
// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { TokenManager } from './integrations/token-manager';

const tokenManager = new TokenManager();

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            // Base scopes for login
            'openid',
            'email', 
            'profile',
            // Enhanced scopes for Workspace integration
            'https://www.googleapis.com/auth/drive.readonly',
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/calendar.readonly'
          ].join(' '),
          access_type: 'offline',
          prompt: 'consent'        // Force consent to get refresh token
        }
      }
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            'user:email',
            'user:read',
            'repo'                  // Full repo access for comprehensive integration
          ].join(' ')
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // Store provider tokens when user authenticates
      if (account && user?.email) {
        await tokenManager.saveProviderToken(
          user.email,
          account.provider,
          account.access_token!,
          account.refresh_token,
          account.scope?.split(' ') || [],
          account.expires_at ? new Date(account.expires_at * 1000) : undefined
        );
      }
      return token;
    },
    async session({ session, token }) {
      // Add integration status to session
      if (session.user?.email) {
        session.integrations = await tokenManager.getUserIntegrationStatus(
          session.user.email
        );
      }
      return session;
    }
  },
  events: {
    signOut: async ({ token }) => {
      // Revoke tokens on signout
      if (token.email) {
        await tokenManager.revokeUserTokens(token.email as string);
      }
    }
  }
};
```

#### 3.2 Token Management System

```typescript
// src/lib/integrations/token-manager.ts
import { db } from '@/lib/db';
import { userIntegrations } from '@/db/db-schema';
import { eq, and } from 'drizzle-orm';
import { TokenEncryption } from './encryption';

export interface UserIntegrationStatus {
  providerId: string;
  connected: boolean;
  scopes: string[];
  capabilities: string[];
  lastUsed?: Date;
  expiresAt?: Date;
}

export class TokenManager {
  private encryption = new TokenEncryption();

  async saveProviderToken(
    userEmail: string,
    providerId: string,
    accessToken: string,
    refreshToken?: string,
    scopes: string[] = [],
    expiresAt?: Date
  ): Promise<void> {
    const credentials = {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer'
    };

    const encryptedCredentials = this.encryption.encrypt(JSON.stringify(credentials));

    await db
      .insert(userIntegrations)
      .values({
        userEmail,
        providerId,
        credentialsEncrypted: encryptedCredentials,
        scopes,
        expiresAt,
        lastUsed: new Date()
      })
      .onConflictDoUpdate({
        target: [userIntegrations.userEmail, userIntegrations.providerId],
        set: {
          credentialsEncrypted: encryptedCredentials,
          scopes,
          expiresAt,
          lastUsed: new Date()
        }
      });
  }

  async getProviderToken(userEmail: string, providerId: string): Promise<string | null> {
    const result = await db
      .select()
      .from(userIntegrations)
      .where(
        and(
          eq(userIntegrations.userEmail, userEmail),
          eq(userIntegrations.providerId, providerId)
        )
      )
      .limit(1);

    if (result.length === 0) return null;

    const integration = result[0];
    
    // Check if token is expired
    if (integration.expiresAt && integration.expiresAt < new Date()) {
      // Try to refresh token
      const refreshed = await this.refreshToken(userEmail, providerId);
      if (!refreshed) return null;
      
      // Get the updated token
      return this.getProviderToken(userEmail, providerId);
    }

    const credentials = JSON.parse(
      this.encryption.decrypt(integration.credentialsEncrypted)
    );

    return credentials.access_token;
  }

  async hasRequiredScopes(
    userEmail: string,
    providerId: string,
    requiredScopes: string[]
  ): Promise<boolean> {
    const result = await db
      .select()
      .from(userIntegrations)
      .where(
        and(
          eq(userIntegrations.userEmail, userEmail),
          eq(userIntegrations.providerId, providerId)
        )
      )
      .limit(1);

    if (result.length === 0) return false;

    const grantedScopes = result[0].scopes;
    return requiredScopes.every(scope => grantedScopes.includes(scope));
  }

  async getUserIntegrationStatus(userEmail: string): Promise<UserIntegrationStatus[]> {
    const results = await db
      .select()
      .from(userIntegrations)
      .where(eq(userIntegrations.userEmail, userEmail));

    return results.map(integration => {
      const isExpired = integration.expiresAt && integration.expiresAt < new Date();
      const provider = registry.getProvider(integration.providerId);
      
      return {
        providerId: integration.providerId,
        connected: !isExpired,
        scopes: integration.scopes,
        capabilities: provider?.capabilities.map(c => c.id) || [],
        lastUsed: integration.lastUsed || undefined,
        expiresAt: integration.expiresAt || undefined
      };
    });
  }

  private async refreshToken(userEmail: string, providerId: string): Promise<boolean> {
    // Implementation specific to provider OAuth refresh flow
    // Google OAuth 2.0 refresh token example:
    if (providerId === 'google') {
      // Implement Google token refresh
      return this.refreshGoogleToken(userEmail);
    }
    
    return false;
  }

  private async refreshGoogleToken(userEmail: string): Promise<boolean> {
    // Google-specific token refresh implementation
    // This would make a request to Google's token endpoint
    // with the refresh token to get a new access token
    
    // Placeholder - implement actual Google token refresh
    return false;
  }

  async revokeUserTokens(userEmail: string): Promise<void> {
    // Revoke all provider tokens for user
    const integrations = await db
      .select()
      .from(userIntegrations)
      .where(eq(userIntegrations.userEmail, userEmail));

    for (const integration of integrations) {
      await this.revokeProviderToken(userEmail, integration.providerId);
    }

    // Remove from database
    await db
      .delete(userIntegrations)
      .where(eq(userIntegrations.userEmail, userEmail));
  }

  private async revokeProviderToken(userEmail: string, providerId: string): Promise<void> {
    const token = await this.getProviderToken(userEmail, providerId);
    if (!token) return;

    const provider = registry.getProvider(providerId);
    if (!provider?.endpoints.revoke) return;

    try {
      // Make revocation request to provider
      await fetch(provider.endpoints.revoke, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `token=${token}`
      });
    } catch (error) {
      console.error(`Failed to revoke ${providerId} token:`, error);
    }
  }
}
```

#### 3.3 Token Encryption

```typescript
// src/lib/integrations/encryption.ts
import crypto from 'crypto';

export class TokenEncryption {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;

  constructor() {
    const keyHex = process.env.TOKEN_ENCRYPTION_KEY;
    if (!keyHex) {
      throw new Error('TOKEN_ENCRYPTION_KEY environment variable required');
    }
    this.key = Buffer.from(keyHex, 'hex');
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    cipher.setAAD(Buffer.from('integrations'));

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();
    
    return JSON.stringify({
      iv: iv.toString('hex'),
      encrypted,
      authTag: authTag.toString('hex')
    });
  }

  decrypt(encryptedData: string): string {
    const { iv, encrypted, authTag } = JSON.parse(encryptedData);
    
    const decipher = crypto.createDecipher(this.algorithm, this.key);
    decipher.setAAD(Buffer.from('integrations'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
```

### 4. Cross-App Integration Client

#### 4.1 Integration Service Client

```typescript
// src/lib/integrations/client.ts
import { registry } from './registry';
import { TokenManager } from './token-manager';
import { logIntegrationUsage } from './audit';

export interface DataRequest {
  capability: string;                    // 'github.user_issues'
  userEmail: string;
  requestingApp: string;                 // 'ai-admin-assistant'
  parameters?: Record<string, any>;
  cacheOptions?: {
    enabled: boolean;
    ttl: number;                         // Cache TTL in seconds
  };
}

export class IntegrationClient {
  private tokenManager = new TokenManager();

  async getData<T>(request: DataRequest): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      // 1. Validate capability exists
      const capability = registry.getCapability(request.capability);
      if (!capability) {
        throw new Error(`Capability ${request.capability} not found`);
      }

      // 2. Validate app permission
      await this.validateAppPermission(request.requestingApp, request.capability);

      // 3. Check user authentication
      const hasAuth = await this.validateUserAuthentication(
        request.userEmail,
        capability.providerId,
        capability.requiredScopes
      );

      if (!hasAuth) {
        throw new Error(`User not authenticated for ${capability.providerId}`);
      }

      // 4. Check cache if enabled
      if (request.cacheOptions?.enabled) {
        const cached = await this.getFromCache<T>(request);
        if (cached) {
          await this.logUsage(request, true, Date.now() - startTime);
          return cached;
        }
      }

      // 5. Make API request
      const data = await this.makeApiRequest<T>(capability, request);

      // 6. Cache result if configured
      if (request.cacheOptions?.enabled && data) {
        await this.cacheData(request, data, request.cacheOptions.ttl);
      }

      // 7. Log successful usage
      await this.logUsage(request, true, Date.now() - startTime);

      return data;

    } catch (error) {
      // Log failed usage
      await this.logUsage(request, false, Date.now() - startTime, error as Error);
      
      console.error(`Integration ${request.capability} failed:`, error);
      return null;
    }
  }

  private async validateAppPermission(appId: string, capability: string): Promise<void> {
    // Check if app is allowed to use this capability
    // This could be stored in database or derived from app definitions
    const app = getApplicationById(appId);
    if (!app?.integrations) {
      throw new Error(`App ${appId} has no integration requirements`);
    }

    const allRequirements = [
      ...app.integrations.required,
      ...app.integrations.optional
    ];

    const hasPermission = allRequirements.some(req => req.capability === capability);
    if (!hasPermission) {
      throw new Error(`App ${appId} not authorized for capability ${capability}`);
    }
  }

  private async validateUserAuthentication(
    userEmail: string,
    providerId: string,
    requiredScopes: string[]
  ): Promise<boolean> {
    const token = await this.tokenManager.getProviderToken(userEmail, providerId);
    if (!token) return false;

    return this.tokenManager.hasRequiredScopes(userEmail, providerId, requiredScopes);
  }

  private async makeApiRequest<T>(
    capability: IntegrationCapability,
    request: DataRequest
  ): Promise<T> {
    if (!capability.apiEndpoint) {
      throw new Error(`No API endpoint defined for capability ${capability.id}`);
    }

    const response = await fetch(capability.apiEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': request.userEmail,
        'X-Requesting-App': request.requestingApp,
        'X-Capability': capability.id
      },
      body: request.parameters ? JSON.stringify(request.parameters) : undefined
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private async getFromCache<T>(request: DataRequest): Promise<T | null> {
    // Redis-based caching implementation
    const cacheKey = this.getCacheKey(request);
    // Implementation would use Redis client
    return null; // Placeholder
  }

  private async cacheData(request: DataRequest, data: any, ttl: number): Promise<void> {
    // Cache data with TTL
    const cacheKey = this.getCacheKey(request);
    // Implementation would use Redis client with TTL
  }

  private getCacheKey(request: DataRequest): string {
    return `integration:${request.capability}:${request.userEmail}:${JSON.stringify(request.parameters)}`;
  }

  private async logUsage(
    request: DataRequest,
    success: boolean,
    responseTimeMs: number,
    error?: Error
  ): Promise<void> {
    const capability = registry.getCapability(request.capability);
    if (!capability) return;

    await logIntegrationUsage({
      userEmail: request.userEmail,
      providerId: capability.providerId,
      capability: request.capability,
      requestingApp: request.requestingApp,
      operation: 'read', // Derive from request or capability
      success,
      responseTimeMs,
      errorCode: error?.name,
      errorMessage: error?.message
    });
  }

  async isCapabilityAvailable(capability: string, userEmail: string): Promise<boolean> {
    const cap = registry.getCapability(capability);
    if (!cap) return false;

    return this.validateUserAuthentication(userEmail, cap.providerId, cap.requiredScopes);
  }
}

// Export singleton instance
export const integrationClient = new IntegrationClient();
```

### 5. API Endpoints

#### 5.1 Integration Status API

```typescript
// src/app/api/integrations/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { registry } from '@/lib/integrations/registry';
import { getApplicationById } from '@/lib/applications';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const appId = searchParams.get('app');

    if (!appId) {
      // Return all user integrations
      const status = session.integrations || [];
      return NextResponse.json({ integrations: status });
    }

    // Return integrations for specific app
    const app = getApplicationById(appId);
    if (!app?.integrations) {
      return NextResponse.json({ integrations: [] });
    }

    const requirements = [
      ...app.integrations.required.map(req => ({ ...req, priority: 'required' as const })),
      ...app.integrations.optional.map(req => ({ ...req, priority: 'optional' as const }))
    ];

    const userIntegrations = session.integrations || [];
    
    const integrationStatus = requirements.map(req => {
      const capability = registry.getCapability(req.capability);
      const userIntegration = userIntegrations.find(
        ui => ui.providerId === capability?.providerId
      );

      return {
        ...req,
        capability: req.capability,
        name: capability?.name || req.capability,
        description: capability?.description || '',
        available: userIntegration?.connected || false,
        reason: userIntegration?.connected ? 'available' : 'not_configured',
        lastUsed: userIntegration?.lastUsed
      };
    });

    return NextResponse.json({ integrations: integrationStatus });

  } catch (error) {
    console.error('Integration status error:', error);
    return NextResponse.json(
      { error: 'Failed to get integration status' },
      { status: 500 }
    );
  }
}
```

#### 5.2 Cross-App Data Access APIs

```typescript
// src/app/api/integrations/github/user-issues/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { TokenManager } from '@/lib/integrations/token-manager';
import { Octokit } from '@octokit/rest';

const tokenManager = new TokenManager();

export async function GET(req: NextRequest) {
  try {
    const userEmail = req.headers.get('X-User-Email');
    const requestingApp = req.headers.get('X-Requesting-App');

    if (!userEmail || !requestingApp) {
      return NextResponse.json(
        { error: 'Missing required headers' },
        { status: 400 }
      );
    }

    // Get GitHub token for user
    const token = await tokenManager.getProviderToken(userEmail, 'github');
    if (!token) {
      return NextResponse.json(
        { error: 'GitHub integration not configured' },
        { status: 400 }
      );
    }

    const octokit = new Octokit({ auth: token });

    // Get authenticated user
    const { data: user } = await octokit.users.getAuthenticated();

    // Search for user's assigned issues
    const { data: searchResult } = await octokit.search.issuesAndPullRequests({
      q: `assignee:${user.login} is:open type:issue`,
      sort: 'updated',
      order: 'desc',
      per_page: 50
    });

    const issues = searchResult.items.map(issue => ({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      repository: issue.repository_url.split('/').slice(-2).join('/'),
      url: issue.html_url,
      updatedAt: issue.updated_at,
      labels: issue.labels?.map(label => 
        typeof label === 'string' ? label : label.name
      ) || [],
      priority: calculateIssuePriority(issue)
    }));

    return NextResponse.json({
      issues,
      total: searchResult.total_count,
      user: user.login
    });

  } catch (error) {
    console.error('GitHub user issues error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GitHub user issues' },
      { status: 500 }
    );
  }
}

function calculateIssuePriority(issue: any): 'high' | 'medium' | 'low' {
  // Priority calculation based on labels, age, etc.
  const labels = issue.labels?.map(l => typeof l === 'string' ? l : l.name) || [];
  
  if (labels.some(label => label.includes('urgent') || label.includes('critical'))) {
    return 'high';
  }
  
  const daysSinceUpdate = (Date.now() - new Date(issue.updated_at).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceUpdate > 7) {
    return 'high';
  }
  
  if (daysSinceUpdate > 3) {
    return 'medium';
  }
  
  return 'low';
}
```

### 6. Application Integration Updates

#### 6.1 Update Application Definitions

```typescript
// src/lib/applications.ts - Enhanced with integration requirements
export const applications: BackofficeApp[] = [
  {
    id: 'ai-admin-assistant',
    name: 'AI Admin Assistant',
    description: 'AI-powered automation for Google Workspace document-to-email workflows',
    icon: 'Bot',
    path: '/apps/ai-admin-assistant',
    category: 'ai',
    enabled: true,
    integrations: {
      required: [
        {
          capability: 'google.drive',
          purpose: 'Analyze documents for email campaigns',
          fallback: 'disable',
          priority: 'required'
        },
        {
          capability: 'google.gmail',
          purpose: 'Send personalized email campaigns',
          fallback: 'disable',
          priority: 'required'
        }
      ],
      optional: [
        {
          capability: 'github.user_issues',
          purpose: 'Include GitHub tasks in daily summary',
          fallback: 'limited',
          priority: 'optional'
        },
        {
          capability: 'google.calendar',
          purpose: 'Include calendar events in context',
          fallback: 'limited',
          priority: 'optional'
        }
      ],
      provides: [
        {
          capability: 'ai.document_analysis',
          dataType: 'document_analysis',
          endpoint: '/api/apps/ai-admin-assistant/analyze',
          permissions: ['ai:read']
        }
      ]
    }
  },
  {
    id: 'github-timeline',
    name: 'GitHub Timeline Explorer',
    description: 'Explore development timeline with AI insights from GitHub data',
    icon: 'GitBranch',
    path: '/apps/github-timeline',
    category: 'development',
    enabled: true,
    integrations: {
      required: [
        {
          capability: 'github.repos',
          purpose: 'Access repository information',
          fallback: 'disable',
          priority: 'required'
        },
        {
          capability: 'github.issues',
          purpose: 'Display issues in timeline',
          fallback: 'disable',
          priority: 'required'
        }
      ],
      optional: [],
      provides: [
        {
          capability: 'timeline.events',
          dataType: 'timeline_event',
          endpoint: '/api/apps/github-timeline/events',
          permissions: ['timeline:read']
        }
      ]
    }
  }
];
```

### 7. User Interface Components

#### 7.1 Integration Setup Component

```typescript
// src/components/integrations/IntegrationSetup.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';

interface IntegrationStatus {
  capability: string;
  name: string;
  description: string;
  purpose: string;
  priority: 'required' | 'optional';
  available: boolean;
  reason: string;
  lastUsed?: string;
  fallback: 'disable' | 'limited' | 'error';
}

interface IntegrationSetupProps {
  appId: string;
  onIntegrationChange?: (integrations: IntegrationStatus[]) => void;
}

export function IntegrationSetup({ appId, onIntegrationChange }: IntegrationSetupProps) {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    loadIntegrations();
  }, [appId]);

  const loadIntegrations = async () => {
    try {
      const response = await fetch(`/api/integrations/status?app=${appId}`);
      const data = await response.json();
      setIntegrations(data.integrations);
      onIntegrationChange?.(data.integrations);
    } catch (error) {
      console.error('Failed to load integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (capability: string) => {
    setConnecting(capability);
    
    try {
      // Determine provider from capability
      const provider = capability.split('.')[0];
      
      // Redirect to OAuth flow
      window.location.href = `/api/auth/signin/${provider}?callbackUrl=${encodeURIComponent(
        window.location.href
      )}`;
    } catch (error) {
      console.error('Connection failed:', error);
      setConnecting(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading integrations...</span>
        </CardContent>
      </Card>
    );
  }

  const requiredIntegrations = integrations.filter(i => i.priority === 'required');
  const optionalIntegrations = integrations.filter(i => i.priority === 'optional');
  const allRequiredConnected = requiredIntegrations.every(i => i.available);

  return (
    <div className="space-y-6">
      {/* App Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {allRequiredConnected ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-orange-500" />
            )}
            Integration Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            {allRequiredConnected
              ? 'All required integrations are connected. You can use this app.'
              : 'Some required integrations are missing. Connect them to use this app.'}
          </p>
        </CardContent>
      </Card>

      {/* Required Integrations */}
      {requiredIntegrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Required Integrations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {requiredIntegrations.map(integration => (
              <IntegrationCard
                key={integration.capability}
                integration={integration}
                onConnect={handleConnect}
                connecting={connecting === integration.capability}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Optional Integrations */}
      {optionalIntegrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Optional Integrations</CardTitle>
            <p className="text-sm text-gray-600">
              These integrations enhance functionality but are not required.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {optionalIntegrations.map(integration => (
              <IntegrationCard
                key={integration.capability}
                integration={integration}
                onConnect={handleConnect}
                connecting={connecting === integration.capability}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface IntegrationCardProps {
  integration: IntegrationStatus;
  onConnect: (capability: string) => void;
  connecting: boolean;
}

function IntegrationCard({ integration, onConnect, connecting }: IntegrationCardProps) {
  const isRequired = integration.priority === 'required';
  const needsAttention = isRequired && !integration.available;

  return (
    <div className={`flex items-center justify-between p-4 border rounded-lg ${
      needsAttention ? 'border-orange-200 bg-orange-50' : 'border-gray-200'
    }`}>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">{integration.name}</h4>
          {integration.available ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className={`h-4 w-4 ${isRequired ? 'text-orange-500' : 'text-gray-400'}`} />
          )}
          {isRequired && (
            <Badge variant="outline" className="text-xs">
              Required
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1">{integration.purpose}</p>
        {integration.description && (
          <p className="text-xs text-gray-500 mt-1">{integration.description}</p>
        )}
        {integration.lastUsed && (
          <p className="text-xs text-gray-400 mt-1">
            Last used: {new Date(integration.lastUsed).toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Badge variant={integration.available ? "default" : "destructive"}>
          {integration.available ? "Connected" : "Not Connected"}
        </Badge>
        
        {!integration.available && (
          <Button
            size="sm"
            onClick={() => onConnect(integration.capability)}
            disabled={connecting}
          >
            {connecting ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <ExternalLink className="h-3 w-3 mr-1" />
            )}
            Connect
          </Button>
        )}
      </div>
    </div>
  );
}
```

### 8. Migration Strategy

#### 8.1 Backward Compatibility Layer

```typescript
// src/lib/integrations/migration.ts
export class IntegrationMigration {
  async migrateExistingTokens(): Promise<void> {
    // Migrate existing GitHub PATs to new unified system
    await this.migrateGitHubTokens();
    
    // Migrate existing Google OAuth tokens
    await this.migrateGoogleTokens();
  }

  private async migrateGitHubTokens(): Promise<void> {
    // Find existing GitHub PATs in old format
    // Convert to unified token storage format
    // Preserve user associations and permissions
  }

  private async migrateGoogleTokens(): Promise<void> {
    // Find existing Google OAuth tokens
    // Ensure all required scopes are present
    // Update token format for unified system
  }

  async validateMigration(userEmail: string): Promise<boolean> {
    // Verify all integrations work after migration
    // Test API access with new token format
    // Ensure no functionality loss
    return true;
  }
}
```

### 9. Performance and Monitoring

#### 9.1 Rate Limiting

```typescript
// src/lib/integrations/rate-limiter.ts
export class RateLimiter {
  private limits = new Map<string, { count: number; resetTime: number }>();

  async checkLimit(providerId: string, userEmail: string): Promise<boolean> {
    const provider = registry.getProvider(providerId);
    if (!provider) return false;

    const key = `${providerId}:${userEmail}`;
    const limit = this.limits.get(key);
    const now = Date.now();

    if (!limit || now > limit.resetTime) {
      // Reset window
      this.limits.set(key, {
        count: 1,
        resetTime: now + (provider.rateLimit.window * 1000)
      });
      return true;
    }

    if (limit.count >= provider.rateLimit.requests) {
      return false; // Rate limit exceeded
    }

    limit.count++;
    return true;
  }

  getRemainingRequests(providerId: string, userEmail: string): number {
    const provider = registry.getProvider(providerId);
    const limit = this.limits.get(`${providerId}:${userEmail}`);
    
    if (!provider || !limit) return provider?.rateLimit.requests || 0;
    
    return Math.max(0, provider.rateLimit.requests - limit.count);
  }
}
```

### 10. Environment Variables

```bash
# OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Token Encryption
TOKEN_ENCRYPTION_KEY=your_32_byte_hex_key

# Integration Configuration
INTEGRATION_CACHE_TTL=3600           # Default cache TTL in seconds
INTEGRATION_RATE_LIMIT_ENABLED=true  # Enable rate limiting
INTEGRATION_AUDIT_ENABLED=true       # Enable audit logging

# Redis Configuration (for caching and queues)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password
```

## Implementation Timeline

### Week 1-2: Foundation
- [ ] Create integration registry system
- [ ] Implement database schema changes
- [ ] Set up token encryption system
- [ ] Update application definitions

### Week 3-4: Authentication
- [ ] Enhance NextAuth configuration
- [ ] Implement token management system
- [ ] Create provider-specific OAuth flows
- [ ] Add token refresh mechanisms

### Week 5-6: Cross-App Integration
- [ ] Build integration client system
- [ ] Create API endpoints for data sharing
- [ ] Implement rate limiting and caching
- [ ] Add audit logging

### Week 7-8: User Interface & Testing
- [ ] Build integration setup components
- [ ] Create integration status displays
- [ ] Implement migration for existing users
- [ ] Comprehensive testing and optimization

## Success Criteria

- [ ] Users authenticate once per provider for all apps
- [ ] Cross-app data sharing works (GitHub issues in AI Admin)
- [ ] Zero authentication redundancy
- [ ] Seamless OAuth scope enhancement
- [ ] Complete audit trail for all integrations
- [ ] Performance targets met (sub-second for cached data)
- [ ] Backward compatibility maintained during migration

This specification provides a comprehensive implementation plan for unified authentication that eliminates provider redundancy while enabling powerful cross-app integration capabilities.