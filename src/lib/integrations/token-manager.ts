import { db } from '@/lib/db';
import { userIntegrations } from '@/db/db-schema';
import { eq, and } from 'drizzle-orm';
import { encryptToken, decryptToken } from './crypto';
import { registry } from './registry';

export interface UserIntegrationStatus {
  providerId: string;
  connected: boolean;
  scopes: string[];
  capabilities: string[];
  lastUsed?: Date;
  expiresAt?: Date;
}

export interface TokenCredentials {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in?: number;
}

export class TokenManager {
  async saveProviderToken(
    userEmail: string,
    providerId: string,
    accessToken: string,
    refreshToken?: string,
    scopes: string[] = [],
    expiresAt?: Date
  ): Promise<void> {
    if (!db) {
      console.warn('Database not available - token not saved');
      return;
    }

    const credentials: TokenCredentials = {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer'
    };

    const encryptedCredentials = encryptToken(JSON.stringify(credentials));

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
          lastUsed: new Date(),
          updatedAt: new Date()
        }
      });
  }

  async getProviderToken(userEmail: string, providerId: string): Promise<string | null> {
    if (!db) return null;

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

      const credentials: TokenCredentials = JSON.parse(
        decryptToken(integration.credentialsEncrypted)
      );

      return credentials.access_token;
    } catch (error) {
      console.error('Error getting provider token:', error);
      
      // If decryption fails, remove the corrupted integration entry
      if (error instanceof Error && error.message?.includes('Failed to decrypt token')) {
        console.warn(`Removing corrupted integration for ${userEmail}:${providerId}`);
        await this.revokeProviderToken(userEmail, providerId);
      }
      
      return null;
    }
  }

  async hasRequiredScopes(
    userEmail: string,
    providerId: string,
    requiredScopes: string[]
  ): Promise<boolean> {
    if (!db) return false;

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

      if (result.length === 0) return false;

      const grantedScopes = result[0].scopes;
      return requiredScopes.every(scope => grantedScopes.includes(scope));
    } catch (error) {
      console.error('Error checking scopes:', error);
      return false;
    }
  }

  async getUserIntegrationStatus(userEmail: string): Promise<UserIntegrationStatus[]> {
    if (!db) return [];

    try {
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
    } catch (error) {
      console.error('Error getting user integration status:', error);
      return [];
    }
  }

  private async refreshToken(userEmail: string, providerId: string): Promise<boolean> {
    // Implementation specific to provider OAuth refresh flow
    if (providerId === 'google') {
      return this.refreshGoogleToken(userEmail);
    }
    
    return false;
  }

  private async refreshGoogleToken(userEmail: string): Promise<boolean> {
    try {
      if (!db) return false;

      const result = await db
        .select()
        .from(userIntegrations)
        .where(
          and(
            eq(userIntegrations.userEmail, userEmail),
            eq(userIntegrations.providerId, 'google')
          )
        )
        .limit(1);

      if (result.length === 0) return false;

      const credentials: TokenCredentials = JSON.parse(
        decryptToken(result[0].credentialsEncrypted)
      );

      if (!credentials.refresh_token) return false;

      // Make token refresh request to Google
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: credentials.refresh_token,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
      });

      if (!response.ok) {
        console.error('Google token refresh failed:', response.status);
        return false;
      }

      const tokenData = await response.json();
      
      // Save the new token
      await this.saveProviderToken(
        userEmail,
        'google',
        tokenData.access_token,
        credentials.refresh_token, // Keep the same refresh token
        result[0].scopes,
        tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : undefined
      );

      return true;
    } catch (error) {
      console.error('Error refreshing Google token:', error);
      return false;
    }
  }

  async revokeUserTokens(userEmail: string): Promise<void> {
    if (!db) return;

    try {
      // Get all integrations for user
      const integrations = await db
        .select()
        .from(userIntegrations)
        .where(eq(userIntegrations.userEmail, userEmail));

      // Revoke each provider token with the provider first
      for (const integration of integrations) {
        await this.revokeProviderTokenWithProvider(userEmail, integration.providerId);
      }

      // Remove from database
      await db
        .delete(userIntegrations)
        .where(eq(userIntegrations.userEmail, userEmail));
    } catch (error) {
      console.error('Error revoking user tokens:', error);
    }
  }

  async revokeProviderToken(userEmail: string, providerId: string): Promise<void> {
    if (!db) return;

    try {
      // Remove the integration from database
      await db
        .delete(userIntegrations)
        .where(
          and(
            eq(userIntegrations.userEmail, userEmail),
            eq(userIntegrations.providerId, providerId)
          )
        );
    } catch (error) {
      console.error(`Failed to remove ${providerId} integration:`, error);
      throw error;
    }
  }

  private async revokeProviderTokenWithProvider(userEmail: string, providerId: string): Promise<void> {
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

// Export singleton instance
export const tokenManager = new TokenManager();