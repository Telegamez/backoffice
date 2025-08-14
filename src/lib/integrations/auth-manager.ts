import { tokenManager } from './token-manager';

export interface UserIntegrationStatus {
  connected: boolean;
  lastUsed?: Date;
  tokenExpiry?: Date;
}

// Legacy compatibility functions - these now delegate to the new TokenManager
export async function getUserIntegrationStatus(
  userEmail: string,
  providerId: string
): Promise<UserIntegrationStatus> {
  const statuses = await tokenManager.getUserIntegrationStatus(userEmail);
  const status = statuses.find(s => s.providerId === providerId);
  
  if (!status) {
    return { connected: false };
  }

  return {
    connected: status.connected,
    lastUsed: status.lastUsed,
    tokenExpiry: status.expiresAt
  };
}

export async function getUserGitHubToken(userEmail: string): Promise<string | null> {
  return tokenManager.getProviderToken(userEmail, 'github');
}

export async function saveUserIntegration(
  userEmail: string,
  providerId: string,
  credentials: string,
  scopes: string[],
  expiresAt?: Date
): Promise<void> {
  // For backward compatibility, assume credentials is just the access token
  await tokenManager.saveProviderToken(
    userEmail,
    providerId,
    credentials,
    undefined, // no refresh token in legacy calls
    scopes,
    expiresAt
  );
}

// Export the token manager for direct access to new functionality
export { tokenManager };