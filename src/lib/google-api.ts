import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { tokenManager } from './integrations/token-manager';

/**
 * Google API client using Service Account with domain-wide delegation
 * Falls back to user OAuth tokens if service account is not configured
 */
export class GoogleAPIClient {
  private jwtClient?: JWT;
  private userEmail: string;
  private useServiceAccount: boolean;

  constructor(userEmail: string) {
    this.userEmail = userEmail;
    this.useServiceAccount = this.isServiceAccountConfigured();
    
    if (this.useServiceAccount) {
      this.initializeServiceAccount();
    }
  }

  private isServiceAccountConfigured(): boolean {
    return !!(
      process.env.GOOGLE_PROJECT_ID &&
      process.env.GOOGLE_PRIVATE_KEY &&
      process.env.GOOGLE_CLIENT_EMAIL
    );
  }

  private initializeServiceAccount() {
    if (!this.useServiceAccount) return;

    try {
      this.jwtClient = new JWT({
        email: process.env.GOOGLE_CLIENT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        scopes: [
          'https://www.googleapis.com/auth/drive.readonly',
          'https://www.googleapis.com/auth/gmail.modify',
          'https://www.googleapis.com/auth/calendar.readonly',
        ],
        subject: this.userEmail, // Impersonate this user
      });
    } catch (error) {
      console.error('Failed to initialize service account:', error);
      this.useServiceAccount = false;
    }
  }

  private async getOAuthClient() {
    try {
      const credentials = await tokenManager.getProviderCredentials(this.userEmail, 'google');
      if (!credentials) {
        throw new Error('No Google OAuth tokens found for user');
      }

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      oauth2Client.setCredentials({
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token,
        token_type: credentials.token_type,
      });

      return oauth2Client;
    } catch (error) {
      console.error('Failed to get OAuth client:', error);
      throw error;
    }
  }

  private async getAuthClient() {
    if (this.useServiceAccount && this.jwtClient) {
      await this.jwtClient.authorize();
      return this.jwtClient;
    } else {
      return await this.getOAuthClient();
    }
  }

  async getDriveClient() {
    const auth = await this.getAuthClient();
    return google.drive({ version: 'v3', auth });
  }

  async getGmailClient() {
    const auth = await this.getAuthClient();
    return google.gmail({ version: 'v1', auth });
  }

  async getCalendarClient() {
    const auth = await this.getAuthClient();
    return google.calendar({ version: 'v3', auth });
  }

  async getYouTubeClient() {
    const auth = await this.getAuthClient();
    return google.youtube({ version: 'v3', auth });
  }

  // Test authentication
  async testAuthentication() {
    try {
      const drive = await this.getDriveClient();
      const response = await drive.about.get({ fields: 'user' });
      return {
        success: true,
        user: response.data.user,
        authMethod: this.useServiceAccount ? 'service_account' : 'oauth',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        authMethod: this.useServiceAccount ? 'service_account' : 'oauth',
      };
    }
  }
}