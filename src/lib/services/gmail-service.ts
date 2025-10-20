import { GoogleAPIClient } from '../google-api';
import { db } from '@/db/index';
import { adminAssistantAudit } from '@/db/db-schema';

export interface EmailMessage {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  from?: string;
}

export interface SentEmailResult {
  id: string;
  threadId: string;
  labelIds: string[];
}

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  labels: string[];
  internalDate: string;
}

export interface ListMessagesOptions {
  maxResults?: number;
  query?: string;
  labelIds?: string[];
}

/**
 * GmailService integrates with Gmail API
 * Provides email sending capabilities from user's Gmail account
 */
export class GmailService {
  private googleClient: GoogleAPIClient;
  private userEmail: string;

  constructor(userEmail: string) {
    this.userEmail = userEmail;
    this.googleClient = new GoogleAPIClient(userEmail);
  }

  /**
   * Send an email from user's Gmail account
   */
  async sendEmail(message: EmailMessage): Promise<SentEmailResult> {
    

    try {
      const gmail = await this.googleClient.getGmailClient();

      // Create email message in RFC 2822 format
      const emailContent = this.createEmailContent(message);

      // Encode to base64url
      const encodedMessage = Buffer.from(emailContent)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Send email
      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      const result: SentEmailResult = {
        id: response.data.id || '',
        threadId: response.data.threadId || '',
        labelIds: response.data.labelIds || [],
      };

      // Log successful send
      if (db) {
        await db.insert(adminAssistantAudit).values({
          userEmail: this.userEmail,
          actionType: 'gmail_write', operation: 'send_email', success: true,
          details: {
            operation: 'send_email',
            to: Array.isArray(message.to) ? message.to : [message.to],
            subject: message.subject,
            messageId: result.id,
          },
        });
      }

      return result;
    } catch (error) {
      console.error('Failed to send email:', error);

      if (db) {
        await db.insert(adminAssistantAudit).values({
          userEmail: this.userEmail,
          actionType: 'gmail_write',
          operation: 'send_email',
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error),
          details: {
            to: Array.isArray(message.to) ? message.to : [message.to],
            subject: message.subject,
          },
        });
      }

      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Send a simple text email
   */
  async sendSimpleEmail(to: string, subject: string, body: string): Promise<SentEmailResult> {
    return this.sendEmail({
      to,
      subject,
      text: body,
    });
  }

  /**
   * Send an HTML email with optional text fallback
   */
  async sendHtmlEmail(
    to: string | string[],
    subject: string,
    html: string,
    text?: string
  ): Promise<SentEmailResult> {
    return this.sendEmail({
      to,
      subject,
      html,
      text: text || this.stripHtml(html),
    });
  }

  /**
   * Create RFC 2822 formatted email content
   */
  private createEmailContent(message: EmailMessage): string {
    const lines: string[] = [];

    // From (use specified from address or default to user's email)
    lines.push(`From: ${message.from || this.userEmail}`);

    // To
    const toList = Array.isArray(message.to) ? message.to.join(', ') : message.to;
    lines.push(`To: ${toList}`);

    // CC
    if (message.cc) {
      const ccList = Array.isArray(message.cc) ? message.cc.join(', ') : message.cc;
      lines.push(`Cc: ${ccList}`);
    }

    // BCC
    if (message.bcc) {
      const bccList = Array.isArray(message.bcc) ? message.bcc.join(', ') : message.bcc;
      lines.push(`Bcc: ${bccList}`);
    }

    // Reply-To
    if (message.replyTo) {
      lines.push(`Reply-To: ${message.replyTo}`);
    }

    // Subject
    lines.push(`Subject: ${message.subject}`);

    // MIME headers
    lines.push('MIME-Version: 1.0');

    if (message.html) {
      // Multipart message with both HTML and text
      const boundary = `boundary_${Date.now()}`;
      lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
      lines.push('');
      lines.push(`--${boundary}`);

      // Text part
      if (message.text) {
        lines.push('Content-Type: text/plain; charset=UTF-8');
        lines.push('');
        lines.push(message.text);
        lines.push('');
        lines.push(`--${boundary}`);
      }

      // HTML part
      lines.push('Content-Type: text/html; charset=UTF-8');
      lines.push('');
      lines.push(message.html);
      lines.push('');
      lines.push(`--${boundary}--`);
    } else {
      // Plain text only
      lines.push('Content-Type: text/plain; charset=UTF-8');
      lines.push('');
      lines.push(message.text || '');
    }

    return lines.join('\r\n');
  }

  /**
   * Strip HTML tags for text fallback
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  /**
   * Create a formatted email signature
   */
  createSignature(name?: string): string {
    const lines: string[] = [];
    lines.push('---');
    if (name) {
      lines.push(name);
    }
    lines.push('📧 Sent via Autonomous Agent Scheduler');
    lines.push('🤖 Generated with AI assistance');
    return lines.join('\n');
  }

  /**
   * List messages from Gmail inbox
   */
  async listMessages(options: ListMessagesOptions = {}): Promise<GmailMessage[]> {
    try {
      const gmail = await this.googleClient.getGmailClient();

      const {
        maxResults = 50,
        query = 'in:inbox',
        labelIds,
      } = options;

      // List message IDs
      const listResponse = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: query,
        labelIds,
      });

      const messages = listResponse.data.messages || [];

      if (messages.length === 0) {
        return [];
      }

      // Fetch full message details for each message
      const fullMessages = await Promise.all(
        messages.map(async (msg) => {
          const messageDetails = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id!,
            format: 'metadata',
            metadataHeaders: ['From', 'To', 'Subject', 'Date'],
          });

          const headers = messageDetails.data.payload?.headers || [];
          const getHeader = (name: string) =>
            headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

          return {
            id: messageDetails.data.id || '',
            threadId: messageDetails.data.threadId || '',
            snippet: messageDetails.data.snippet || '',
            from: getHeader('From'),
            to: getHeader('To'),
            subject: getHeader('Subject'),
            date: getHeader('Date'),
            labels: messageDetails.data.labelIds || [],
            internalDate: messageDetails.data.internalDate || '',
          };
        })
      );

      // Log successful fetch
      if (db) {
        await db.insert(adminAssistantAudit).values({
          userEmail: this.userEmail,
          actionType: 'gmail_read',
          operation: 'list_messages',
          success: true,
          details: {
            query,
            messageCount: fullMessages.length,
          },
        });
      }

      return fullMessages;
    } catch (error) {
      console.error('Failed to list messages:', error);

      if (db) {
        await db.insert(adminAssistantAudit).values({
          userEmail: this.userEmail,
          actionType: 'gmail_read',
          operation: 'list_messages',
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error),
          details: {
            query: options.query,
          },
        });
      }

      throw new Error(`Failed to list messages: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get unread messages from inbox
   */
  async getUnreadMessages(maxResults: number = 50): Promise<GmailMessage[]> {
    return this.listMessages({
      maxResults,
      query: 'in:inbox is:unread',
    });
  }

  /**
   * Get recent inbox messages
   */
  async getRecentMessages(maxResults: number = 50): Promise<GmailMessage[]> {
    return this.listMessages({
      maxResults,
      query: 'in:inbox',
    });
  }

  /**
   * Check if Gmail is accessible
   */
  async checkAccess(): Promise<boolean> {
    try {
      const gmail = await this.googleClient.getGmailClient();
      await gmail.users.getProfile({ userId: 'me' });
      return true;
    } catch (error) {
      console.error('Gmail access check failed:', error);
      return false;
    }
  }
}
