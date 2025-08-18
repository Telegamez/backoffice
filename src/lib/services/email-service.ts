import { GoogleAPIClient } from '../google-api';
import { db } from '../db';
import { adminAssistantAudit } from '@/db/db-schema';

interface EmailRecipient {
  name?: string;
  email: string;
}

interface EmailContent {
  subject: string;
  body: string; // HTML body
}

export class EmailService {
  private googleClient: GoogleAPIClient;
  private userEmail: string;

  constructor(userEmail: string) {
    this.userEmail = userEmail;
    this.googleClient = new GoogleAPIClient(userEmail);
  }

  private createMimeMessage(recipient: EmailRecipient, content: EmailContent): string {
    const to = recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email;
    const subject = Buffer.from(content.subject).toString('base64');
    const utf8Body = Buffer.from(content.body).toString('utf-8');

    const messageParts = [
      `From: ${this.userEmail}`,
      `To: ${to}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: =?UTF-8?B?${subject}?=`,
      '',
      utf8Body,
    ];
    return Buffer.from(messageParts.join('\n')).toString('base64url');
  }

  async sendEmail(recipient: EmailRecipient, content: EmailContent): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const startTime = Date.now();
    try {
      const gmail = await this.googleClient.getGmailClient();
      const rawMessage = this.createMimeMessage(recipient, content);

      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: rawMessage,
        },
      });

      const messageId = response.data.id;
      if (!messageId) {
        throw new Error('Gmail API did not return a message ID.');
      }

      await db.insert(adminAssistantAudit).values({
        userEmail: this.userEmail,
        actionType: 'gmail_send',
        resourceId: messageId,
        operation: 'send',
        success: true,
        responseTimeMs: Date.now() - startTime,
      });

      return { success: true, messageId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during email send';
      await db.insert(adminAssistantAudit).values({
        userEmail: this.userEmail,
        actionType: 'gmail_send',
        operation: 'send',
        success: false,
        errorMessage,
        responseTimeMs: Date.now() - startTime,
      });
      return { success: false, error: errorMessage };
    }
  }
}
