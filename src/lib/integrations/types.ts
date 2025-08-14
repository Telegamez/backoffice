export interface IntegrationCapability {
  id: string;                          // 'github.issues', 'google.drive'
  providerId: string;                  // 'github', 'google'
  name: string;
  description: string;
  dataTypes: string[];                 // ['document', 'email', 'issue']
  operations: ('read' | 'write' | 'sync')[];
  requiredScopes: string[];            // OAuth scopes beyond base
  dependencies?: string[];             // Other capabilities this depends on
  apiEndpoint?: string;                // Cross-app access endpoint
}

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

export interface UserIntegrationStatus {
  providerId: string;
  connected: boolean;
  capabilities: string[];
  lastUsed?: Date;
  tokenExpiry?: Date;
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