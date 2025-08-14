import { registry } from './registry';
import { tokenManager } from './token-manager';
import { logIntegrationUsage } from './audit';

export interface DataRequest {
  capability: string;
  userEmail: string;
  parameters?: Record<string, unknown>;
  requestingApp: string;
  cacheOptions?: {
    enabled: boolean;
    ttl: number;                         // Cache TTL in seconds
  };
}

export class IntegrationClient {
  async getData<T>(request: DataRequest): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      // 1. Validate capability exists
      const capability = registry.getCapability(request.capability);
      if (!capability) {
        throw new Error(`Capability ${request.capability} not found`);
      }

      // 2. Check user authentication
      const hasAuth = await this.validateUserAuthentication(
        request.userEmail,
        capability.providerId,
        capability.requiredScopes
      );

      if (!hasAuth) {
        throw new Error(`User not authenticated for ${capability.providerId}`);
      }

      // 3. Check cache if enabled
      if (request.cacheOptions?.enabled) {
        const cached = await this.getFromCache<T>(request);
        if (cached) {
          await this.logUsage(request, true, Date.now() - startTime);
          return cached;
        }
      }

      // 4. Make API request
      const data = await this.makeApiRequest<T>(capability, request);

      // 5. Cache result if configured
      if (request.cacheOptions?.enabled && data) {
        await this.cacheData(request, data, request.cacheOptions.ttl);
      }

      // 6. Log successful usage
      await this.logUsage(request, true, Date.now() - startTime);

      return data;

    } catch (error) {
      // Log failed usage
      await this.logUsage(request, false, Date.now() - startTime, error as Error);
      
      console.error(`Integration ${request.capability} failed:`, error);
      return null;
    }
  }

  private async validateUserAuthentication(
    userEmail: string,
    providerId: string,
    requiredScopes: string[]
  ): Promise<boolean> {
    const token = await tokenManager.getProviderToken(userEmail, providerId);
    if (!token) return false;

    return tokenManager.hasRequiredScopes(userEmail, providerId, requiredScopes);
  }

  private async makeApiRequest<T>(
    capability: { id: string; apiEndpoint?: string },
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async getFromCache<T>(_request: DataRequest): Promise<T | null> {
    // Redis-based caching implementation placeholder
    // In production, this would use Redis client
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async cacheData(_request: DataRequest, _data: unknown, _ttl: number): Promise<void> {
    // Cache data with TTL placeholder
    // In production, this would use Redis client with TTL
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

  async isCapabilityAvailable(
    capability: string,
    userEmail: string
  ): Promise<boolean> {
    const cap = registry.getCapability(capability);
    if (!cap) return false;

    try {
      // Check availability via API instead of direct database access
      const response = await fetch(`/api/integrations/status?app=ai-admin-assistant&userEmail=${encodeURIComponent(userEmail)}`);
      if (!response.ok) return false;
      
      const data = await response.json();
      const integration = data.integrations?.find((i: { capability: string; available: boolean }) => i.capability === capability);
      return integration?.available || false;
    } catch (error) {
      console.error('Failed to check capability availability:', error);
      return false;
    }
  }
}

export const integrationClient = new IntegrationClient();