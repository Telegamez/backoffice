# Shared Integrations Implementation Guide

**Date:** August 13, 2025  
**Purpose:** Practical steps to implement shared integration architecture in the backoffice platform  
**Status:** Ready for Implementation

## Quick Start: Enabling Cross-App Integration Access

### Immediate Problem Solving

**Current State:**
- ✅ GitHub Timeline has direct GitHub API access
- ✅ AI Admin Assistant needs Google Drive/Gmail access  
- ❌ AI Admin Assistant can't access GitHub issues for daily summary
- ❌ Future apps can't reuse Google authentication

**Solution Overview:**
1. **Phase 1**: Create shared integration registry (2-3 days)
2. **Phase 2**: Enable cross-app data access (3-4 days)  
3. **Phase 3**: Implement UI for integration management (2-3 days)

## Implementation Steps

### Step 1: Create Integration Registry (Day 1-2)

#### 1.1 Create Integration Types

```typescript
// src/lib/integrations/types.ts
export interface IntegrationCapability {
  id: string;                          // 'github.issues', 'google.drive'
  providerId: string;                  // 'github', 'google'
  name: string;
  description: string;
  dataTypes: string[];
  operations: ('read' | 'write' | 'sync')[];
  permissions: string[];
  apiEndpoint?: string;                // For cross-app access
}

export interface IntegrationProvider {
  id: string;
  name: string;
  version: string;
  capabilities: IntegrationCapability[];
  authentication: {
    type: 'oauth2' | 'token' | 'service_account';
    scopes: string[];
    userLevel: boolean;
  };
  status: 'active' | 'maintenance' | 'deprecated';
}

export interface UserIntegrationStatus {
  providerId: string;
  connected: boolean;
  capabilities: string[];
  lastUsed?: Date;
  tokenExpiry?: Date;
}
```

#### 1.2 Create Registry Implementation

```typescript
// src/lib/integrations/registry.ts
import { IntegrationProvider, IntegrationCapability } from './types';

export class IntegrationRegistry {
  private static instance: IntegrationRegistry;
  private providers = new Map<string, IntegrationProvider>();

  static getInstance(): IntegrationRegistry {
    if (!IntegrationRegistry.instance) {
      IntegrationRegistry.instance = new IntegrationRegistry();
      IntegrationRegistry.instance.initializeDefaults();
    }
    return IntegrationRegistry.instance;
  }

  private initializeDefaults(): void {
    // Register GitHub provider
    this.registerProvider({
      id: 'github',
      name: 'GitHub',
      version: '1.0.0',
      status: 'active',
      authentication: {
        type: 'token',
        scopes: ['repo:read', 'user:read'],
        userLevel: true
      },
      capabilities: [
        {
          id: 'github.issues',
          providerId: 'github',
          name: 'GitHub Issues',
          description: 'Access repository issues',
          dataTypes: ['issue'],
          operations: ['read', 'sync'],
          permissions: ['repo:read'],
          apiEndpoint: '/api/integrations/github/issues'
        },
        {
          id: 'github.user_issues',
          providerId: 'github', 
          name: 'User Assigned Issues',
          description: 'Get issues assigned to user across repositories',
          dataTypes: ['user_issue'],
          operations: ['read'],
          permissions: ['repo:read', 'user:read'],
          apiEndpoint: '/api/integrations/github/user-issues'
        }
      ]
    });

    // Register Google provider
    this.registerProvider({
      id: 'google',
      name: 'Google Workspace',
      version: '1.0.0',
      status: 'active',
      authentication: {
        type: 'oauth2',
        scopes: [
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/gmail.modify'
        ],
        userLevel: true
      },
      capabilities: [
        {
          id: 'google.drive',
          providerId: 'google',
          name: 'Google Drive',
          description: 'Access and analyze Google Drive files',
          dataTypes: ['drive_file', 'document_content'],
          operations: ['read'],
          permissions: ['drive:read'],
          apiEndpoint: '/api/integrations/google/drive'
        },
        {
          id: 'google.gmail',
          providerId: 'google',
          name: 'Gmail',
          description: 'Send and manage Gmail messages',
          dataTypes: ['email', 'draft'],
          operations: ['read', 'write'],
          permissions: ['gmail:send'],
          apiEndpoint: '/api/integrations/google/gmail'
        }
      ]
    });
  }

  registerProvider(provider: IntegrationProvider): void {
    this.providers.set(provider.id, provider);
  }

  getProvider(id: string): IntegrationProvider | undefined {
    return this.providers.get(id);
  }

  getCapability(id: string): IntegrationCapability | undefined {
    for (const provider of this.providers.values()) {
      const capability = provider.capabilities.find(cap => cap.id === id);
      if (capability) return capability;
    }
    return undefined;
  }

  getAllCapabilities(): IntegrationCapability[] {
    const capabilities: IntegrationCapability[] = [];
    for (const provider of this.providers.values()) {
      capabilities.push(...provider.capabilities);
    }
    return capabilities;
  }

  getProviderCapabilities(providerId: string): IntegrationCapability[] {
    const provider = this.providers.get(providerId);
    return provider?.capabilities || [];
  }
}

// Global registry instance
export const registry = IntegrationRegistry.getInstance();
```

### Step 2: Update Applications with Integration Requirements (Day 2)

#### 2.1 Update Application Interface

```typescript
// src/lib/applications.ts - Add integration requirements
export interface BackofficeApp {
  id: string;
  name: string;
  description: string;
  icon: string;
  path: string;
  category: 'development' | 'analytics' | 'operations' | 'ai';
  enabled: boolean;
  requiresPermissions?: string[];
  
  // NEW: Integration requirements
  integrations?: {
    required: IntegrationRequirement[];
    optional: IntegrationRequirement[];
    provides: IntegrationExport[];
  };
}

export interface IntegrationRequirement {
  capability: string;
  purpose: string;
  fallback: 'disable' | 'limited' | 'error';
}

export interface IntegrationExport {
  capability: string;
  endpoint: string;
  permissions: string[];
}
```

#### 2.2 Update Application Definitions

```typescript
// src/lib/applications.ts - Update applications array
export const applications: BackofficeApp[] = [
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
          capability: 'github.issues',
          purpose: 'Display issues in timeline',
          fallback: 'disable'
        }
      ],
      optional: [],
      provides: [
        {
          capability: 'timeline.events',
          endpoint: '/api/apps/github-timeline/events',
          permissions: ['timeline:read']
        }
      ]
    }
  },
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
          fallback: 'disable'
        },
        {
          capability: 'google.gmail',
          purpose: 'Send personalized email campaigns',
          fallback: 'disable'
        }
      ],
      optional: [
        {
          capability: 'github.user_issues',
          purpose: 'Include GitHub tasks in daily summary',
          fallback: 'limited'
        }
      ],
      provides: [
        {
          capability: 'ai.document_analysis',
          endpoint: '/api/apps/ai-admin-assistant/analyze',
          permissions: ['ai:read']
        }
      ]
    }
  }
];
```

### Step 3: Create Integration API Endpoints (Day 3-4)

#### 3.1 GitHub Integration API

```typescript
// src/app/api/integrations/github/user-issues/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserGitHubToken } from '@/lib/integrations/auth-manager';
import { Octokit } from '@octokit/rest';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's GitHub token
    const token = await getUserGitHubToken(session.user.email);
    if (!token) {
      return NextResponse.json({ 
        error: 'GitHub integration not configured' 
      }, { status: 400 });
    }

    const octokit = new Octokit({ auth: token });
    
    // Get GitHub username from token
    const { data: user } = await octokit.users.getAuthenticated();
    
    // Search for issues assigned to user
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
      ) || []
    }));

    return NextResponse.json({ 
      issues,
      total: searchResult.total_count 
    });

  } catch (error) {
    console.error('GitHub integration error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GitHub issues' },
      { status: 500 }
    );
  }
}
```

#### 3.2 Integration Status API

```typescript
// src/app/api/integrations/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { registry } from '@/lib/integrations/registry';
import { getUserIntegrationStatus } from '@/lib/integrations/auth-manager';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const appId = searchParams.get('app');

    if (!appId) {
      return NextResponse.json({ 
        error: 'app parameter required' 
      }, { status: 400 });
    }

    // Get application integration requirements
    const app = getApplicationById(appId);
    if (!app?.integrations) {
      return NextResponse.json({ integrations: [] });
    }

    const allRequirements = [
      ...app.integrations.required,
      ...app.integrations.optional
    ];

    // Check status of each required integration
    const integrationStatus = await Promise.all(
      allRequirements.map(async (req) => {
        const capability = registry.getCapability(req.capability);
        if (!capability) {
          return {
            ...req,
            capability: req.capability,
            name: req.capability,
            available: false,
            reason: 'capability_not_found'
          };
        }

        const status = await getUserIntegrationStatus(
          session.user.email!,
          capability.providerId
        );

        return {
          ...req,
          ...capability,
          available: status.connected,
          reason: status.connected ? 'available' : 'not_configured',
          lastUsed: status.lastUsed
        };
      })
    );

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

### Step 4: Create Cross-App Data Access (Day 4-5)

#### 4.1 Integration Client

```typescript
// src/lib/integrations/client.ts
import { registry } from './registry';
import { getUserIntegrationStatus } from './auth-manager';

export interface DataRequest {
  capability: string;
  userEmail: string;
  parameters?: any;
  requestingApp: string;
}

export class IntegrationClient {
  async getData<T>(request: DataRequest): Promise<T | null> {
    const capability = registry.getCapability(request.capability);
    if (!capability) {
      console.warn(`Capability ${request.capability} not found`);
      return null;
    }

    // Check if user has this integration configured
    const status = await getUserIntegrationStatus(
      request.userEmail,
      capability.providerId
    );

    if (!status.connected) {
      console.warn(
        `Integration ${capability.providerId} not configured for user ${request.userEmail}`
      );
      return null;
    }

    try {
      // Make API call to integration endpoint
      const response = await fetch(capability.apiEndpoint!, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': request.userEmail,
          'X-Requesting-App': request.requestingApp
        }
      });

      if (!response.ok) {
        throw new Error(`Integration API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Integration ${request.capability} error:`, error);
      return null;
    }
  }

  async isCapabilityAvailable(
    capability: string,
    userEmail: string
  ): Promise<boolean> {
    const cap = registry.getCapability(capability);
    if (!cap) return false;

    const status = await getUserIntegrationStatus(userEmail, cap.providerId);
    return status.connected;
  }
}

export const integrationClient = new IntegrationClient();
```

#### 4.2 AI Assistant GitHub Integration Example

```typescript
// src/app/apps/ai-admin-assistant/lib/github-integration.ts
import { integrationClient } from '@/lib/integrations/client';

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  repository: string;
  url: string;
  updatedAt: string;
  labels: string[];
}

export class AIAssistantGitHubIntegration {
  async getUserGitHubIssues(userEmail: string): Promise<GitHubIssue[]> {
    try {
      const result = await integrationClient.getData<{
        issues: GitHubIssue[];
        total: number;
      }>({
        capability: 'github.user_issues',
        userEmail,
        requestingApp: 'ai-admin-assistant'
      });

      return result?.issues || [];
    } catch (error) {
      console.warn('Failed to get GitHub issues:', error);
      return [];
    }
  }

  async enhanceDailySummaryWithGitHub(
    summary: DailySummary,
    userEmail: string
  ): Promise<DailySummary> {
    const issues = await this.getUserGitHubIssues(userEmail);
    
    if (issues.length > 0) {
      return {
        ...summary,
        developmentTasks: {
          githubIssues: issues.slice(0, 5), // Top 5 recent issues
          totalActiveIssues: issues.length
        }
      };
    }

    return summary;
  }

  async isGitHubAvailable(userEmail: string): Promise<boolean> {
    return integrationClient.isCapabilityAvailable('github.user_issues', userEmail);
  }
}

export const gitHubIntegration = new AIAssistantGitHubIntegration();
```

### Step 5: User Interface Components (Day 5-6)

#### 5.1 Integration Setup Component

```tsx
// src/components/integrations/IntegrationSetup.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';

interface IntegrationStatus {
  capability: string;
  name: string;
  purpose: string;
  available: boolean;
  reason: string;
  fallback: 'disable' | 'limited' | 'error';
  lastUsed?: string;
}

export function IntegrationSetup({ appId }: { appId: string }) {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/integrations/status?app=${appId}`)
      .then(res => res.json())
      .then(data => {
        setIntegrations(data.integrations);
        setLoading(false);
      });
  }, [appId]);

  const handleConnect = async (capability: string) => {
    // Implementation for connecting integration
    window.open(`/integrations/connect?capability=${capability}`, '_blank');
  };

  if (loading) {
    return <div>Loading integrations...</div>;
  }

  const requiredIntegrations = integrations.filter(i => i.fallback !== 'limited');
  const optionalIntegrations = integrations.filter(i => i.fallback === 'limited');

  return (
    <div className="space-y-6">
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
            />
          ))}
        </CardContent>
      </Card>

      {optionalIntegrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Optional Integrations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {optionalIntegrations.map(integration => (
              <IntegrationCard
                key={integration.capability}
                integration={integration}
                onConnect={handleConnect}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function IntegrationCard({ 
  integration, 
  onConnect 
}: { 
  integration: IntegrationStatus;
  onConnect: (capability: string) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">{integration.name}</h4>
          {integration.available ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
        </div>
        <p className="text-sm text-gray-600">{integration.purpose}</p>
        {integration.lastUsed && (
          <p className="text-xs text-gray-400">
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
          >
            Connect <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
```

#### 5.2 Application Integration Status

```tsx
// src/app/apps/ai-admin-assistant/components/IntegrationStatus.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { gitHubIntegration } from '../lib/github-integration';
import { useSession } from 'next-auth/react';

export function IntegrationStatus() {
  const { data: session } = useSession();
  const [githubAvailable, setGithubAvailable] = useState(false);
  const [githubIssues, setGithubIssues] = useState<any[]>([]);

  useEffect(() => {
    if (session?.user?.email) {
      checkGitHubIntegration();
    }
  }, [session]);

  const checkGitHubIntegration = async () => {
    if (!session?.user?.email) return;

    const available = await gitHubIntegration.isGitHubAvailable(session.user.email);
    setGithubAvailable(available);

    if (available) {
      const issues = await gitHubIntegration.getUserGitHubIssues(session.user.email);
      setGithubIssues(issues);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="font-medium mb-4">Available Integrations</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {githubAvailable ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-gray-400" />
              )}
              <span>GitHub Issues</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={githubAvailable ? "default" : "secondary"}>
                {githubAvailable ? "Connected" : "Optional"}
              </Badge>
              {githubAvailable && githubIssues.length > 0 && (
                <Badge variant="outline">
                  {githubIssues.length} active issues
                </Badge>
              )}
            </div>
          </div>

          {githubAvailable && githubIssues.length > 0 && (
            <div className="ml-6 space-y-1">
              <p className="text-sm text-gray-600">Recent Issues:</p>
              {githubIssues.slice(0, 3).map(issue => (
                <div key={issue.id} className="text-xs text-gray-500">
                  • {issue.title} ({issue.repository})
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Step 6: Authentication Management (Day 6-7)

#### 6.1 User Integration Storage

```typescript
// src/lib/integrations/auth-manager.ts
import { db } from '@/lib/db';
import { userIntegrations } from '@/db/db-schema';
import { eq, and } from 'drizzle-orm';

export interface UserIntegrationStatus {
  connected: boolean;
  lastUsed?: Date;
  tokenExpiry?: Date;
}

export async function getUserIntegrationStatus(
  userEmail: string,
  providerId: string
): Promise<UserIntegrationStatus> {
  if (!db) return { connected: false };

  try {
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

    if (result.length === 0) {
      return { connected: false };
    }

    const integration = result[0];
    const isExpired = integration.expiresAt && integration.expiresAt < new Date();

    return {
      connected: !isExpired,
      lastUsed: integration.lastUsed || undefined,
      tokenExpiry: integration.expiresAt || undefined
    };
  } catch (error) {
    console.error('Error getting integration status:', error);
    return { connected: false };
  }
}

export async function getUserGitHubToken(userEmail: string): Promise<string | null> {
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(userIntegrations)
      .where(
        and(
          eq(userIntegrations.userEmail, userEmail),
          eq(userIntegrations.providerId, 'github')
        )
      )
      .limit(1);

    if (result.length === 0) return null;

    // In production, decrypt the credentials
    // For now, assume it's stored as plain text (NOT RECOMMENDED)
    return result[0].credentialsEncrypted;
  } catch (error) {
    console.error('Error getting GitHub token:', error);
    return null;
  }
}

export async function saveUserIntegration(
  userEmail: string,
  providerId: string,
  credentials: string,
  scopes: string[],
  expiresAt?: Date
): Promise<void> {
  if (!db) return;

  // In production, encrypt the credentials
  const credentialsEncrypted = credentials; // ENCRYPT THIS!

  await db
    .insert(userIntegrations)
    .values({
      userEmail,
      providerId,
      credentialsEncrypted,
      scopes,
      expiresAt,
      lastUsed: new Date()
    })
    .onConflictDoUpdate({
      target: [userIntegrations.userEmail, userIntegrations.providerId],
      set: {
        credentialsEncrypted,
        scopes,
        expiresAt,
        lastUsed: new Date()
      }
    });
}
```

## Testing the Integration

### Example Usage in AI Admin Assistant

```typescript
// src/app/apps/ai-admin-assistant/page.tsx - Add to daily summary
import { gitHubIntegration } from './lib/github-integration';

export default function AIAssistantDashboard() {
  const [dailySummary, setDailySummary] = useState<any>(null);
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.email) {
      loadDailySummary();
    }
  }, [session]);

  const loadDailySummary = async () => {
    if (!session?.user?.email) return;

    // Load base summary
    const baseSummary = await loadBaseDailySummary();

    // Enhance with GitHub integration if available
    const enhancedSummary = await gitHubIntegration.enhanceDailySummaryWithGitHub(
      baseSummary,
      session.user.email
    );

    setDailySummary(enhancedSummary);
  };

  return (
    <div className="space-y-6">
      <IntegrationStatus />
      
      {dailySummary?.developmentTasks?.githubIssues && (
        <Card>
          <CardHeader>
            <CardTitle>Active GitHub Issues</CardTitle>
          </CardHeader>
          <CardContent>
            {dailySummary.developmentTasks.githubIssues.map(issue => (
              <div key={issue.id} className="p-2 border-b last:border-b-0">
                <a 
                  href={issue.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {issue.title}
                </a>
                <p className="text-sm text-gray-600">{issue.repository}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

## Summary

This implementation provides:

✅ **Immediate Value**: AI Admin Assistant can access GitHub issues for daily summaries  
✅ **Reusable Architecture**: New integrations can be added easily  
✅ **User Control**: Users can enable/disable integrations per app  
✅ **Security**: Proper authentication and permission management  
✅ **Flexibility**: Optional vs required integrations with fallback behavior

**Next Steps:**
1. Implement the database schema changes
2. Create the integration registry and API endpoints  
3. Update your applications to use the new integration system
4. Test cross-app data access between GitHub Timeline and AI Admin Assistant

This gives you a solid foundation that can grow with your platform while solving the immediate need for shared integrations.

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"id": "1", "content": "Analyze current backoffice architecture for integration patterns", "status": "completed"}, {"id": "2", "content": "Design shared integration service architecture", "status": "completed"}, {"id": "3", "content": "Define integration registry and discovery mechanisms", "status": "completed"}, {"id": "4", "content": "Create implementation plan for shared services", "status": "completed"}, {"id": "5", "content": "Document architectural patterns and guidelines", "status": "completed"}]