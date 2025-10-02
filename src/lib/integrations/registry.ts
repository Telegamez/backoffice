import { IntegrationProvider, IntegrationCapability } from './types';

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
        },
        {
          id: 'google.youtube',
          providerId: 'google',
          name: 'YouTube Data',
          description: 'Search and access YouTube videos',
          dataTypes: ['video', 'channel', 'playlist'],
          operations: ['read'],
          requiredScopes: ['https://www.googleapis.com/auth/youtube.readonly'],
          apiEndpoint: '/api/integrations/google/youtube'
        },
        {
          id: 'google.search',
          providerId: 'google',
          name: 'Google Search',
          description: 'Web search using Google Custom Search API',
          dataTypes: ['search_result'],
          operations: ['read'],
          requiredScopes: [],  // Uses API key, not OAuth
          apiEndpoint: '/api/integrations/google/search'
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

  findCapabilitiesByDataType(dataType: string): IntegrationCapability[] {
    return Array.from(this.capabilities.values())
      .filter(capability => capability.dataTypes.includes(dataType));
  }

  getAllCapabilities(): IntegrationCapability[] {
    return Array.from(this.capabilities.values());
  }

  getProviderCapabilities(providerId: string): IntegrationCapability[] {
    const provider = this.providers.get(providerId);
    return provider?.capabilities || [];
  }
}

// Global registry instance
export const registry = IntegrationRegistry.getInstance();