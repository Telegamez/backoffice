import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
}

// Get encryption key from environment with proper validation
function getEncryptionKey(): Buffer {
  const keyHex = process.env.TOKEN_ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error('TOKEN_ENCRYPTION_KEY environment variable is required');
  }
  
  if (keyHex.length !== 64) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
  }
  
  return Buffer.from(keyHex, 'hex');
}

export function encryptToken(token: string): string {
  if (!token) throw new Error('Token is required for encryption');
  
  try {
    const key = getEncryptionKey();
    
    // Generate a random initialization vector
    const iv = crypto.randomBytes(16);
    
    // Create cipher with proper GCM mode using createCipheriv
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt the token
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get the authentication tag for GCM mode
    const tag = cipher.getAuthTag();
    
    // Return encrypted data as JSON string
    const encryptedData: EncryptedData = {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
    
    return JSON.stringify(encryptedData);
  } catch (error) {
    console.error('Token encryption failed:', error);
    throw new Error('Failed to encrypt token');
  }
}

export function decryptToken(encryptedData: string): string {
  if (!encryptedData) throw new Error('Encrypted data is required for decryption');
  
  try {
    const key = getEncryptionKey();
    const data: EncryptedData = JSON.parse(encryptedData);
    
    const iv = Buffer.from(data.iv, 'hex');
    const tag = Buffer.from(data.tag, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Token decryption failed:', error);
    throw new Error('Failed to decrypt token');
  }
}

// Generate a new encryption key for initial setup
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Token validation functions
export function validateGitHubToken(token: string): boolean {
  // GitHub personal access tokens are typically 40 characters long and start with 'ghp_' or 'github_pat_'
  // GitHub Apps tokens start with 'ghs_'
  const githubTokenPattern = /^(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{82}|ghs_[a-zA-Z0-9]{36})$/;
  return githubTokenPattern.test(token);
}

export function validateGoogleToken(token: string): boolean {
  // Google OAuth access tokens are typically JWT format or random strings
  // This is a basic validation - in practice, we'd verify with Google's API
  return token.length > 50 && token.includes('.');
}

// For development/testing purposes - DO NOT USE IN PRODUCTION
export function createMockEncryptedToken(plainToken: string): string {
  console.warn('Using mock encryption - NOT SECURE FOR PRODUCTION');
  return Buffer.from(plainToken).toString('base64');
}

export function decryptMockToken(mockEncrypted: string): string {
  console.warn('Using mock decryption - NOT SECURE FOR PRODUCTION');
  return Buffer.from(mockEncrypted, 'base64').toString('utf8');
}