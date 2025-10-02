import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { adminAssistantWorkflows } from '@/db/db-schema';
import { eq } from 'drizzle-orm';
import { DriveService } from '@/lib/services/drive-service';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workflowId: workflowIdStr } = await params;
    const workflowId = parseInt(workflowIdStr, 10);

    if (isNaN(workflowId)) {
      return NextResponse.json(
        { error: 'Invalid workflow ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { conversationContext, userRequest } = body;

    // Fetch the workflow
    const workflow = await db
      .select()
      .from(adminAssistantWorkflows)
      .where(eq(adminAssistantWorkflows.id, workflowId))
      .limit(1);

    if (workflow.length === 0) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    const workflowData = workflow[0];

    // Get the source document
    const driveService = new DriveService(session.user.email);
    const document = await driveService.getDocument(workflowData.sourceDocumentId);

    if (!document.content) {
      throw new Error('Document content could not be extracted.');
    }

    // Use AI to extract emails and generate drafts based on conversation context
    const { text: emailsJson } = await generateText({
      model: openai('gpt-5'),
      prompt: `Based on the conversation below, generate email drafts for the requested recipients.

Conversation Context:
${conversationContext || 'No previous conversation'}

Latest User Request:
${userRequest}

Document Content (first 2000 chars):
${document.content.substring(0, 2000)}

Extract:
1. The specific email addresses the user wants to contact
2. Any CC addresses mentioned
3. The message/content the user wants to send
4. The subject line (infer from context if not specified)

Generate a JSON array of email objects with this exact structure:
[
  {
    "recipientEmail": "email@example.com",
    "cc": "cc@example.com",
    "subject": "Subject line",
    "content": "Email body in plain text or simple HTML"
  }
]

Return ONLY the JSON array, no markdown, no code blocks.`,
      temperature: 0.3,
    });

    let sampleEmails;
    let totalRecipients = 0;

    try {
      sampleEmails = JSON.parse(emailsJson);
      totalRecipients = Array.isArray(sampleEmails) ? sampleEmails.length : 0;
    } catch {
      // Fallback to regex extraction if AI fails
      const emailPattern = /[\w.-]+@[\w.-]+\.\w+/g;
      const extractedEmails = (conversationContext + ' ' + document.content).match(emailPattern) || [];
      const uniqueEmails = [...new Set(extractedEmails)].slice(0, 3);
      totalRecipients = uniqueEmails.length;

      sampleEmails = uniqueEmails.map(email => ({
        recipientEmail: email,
        subject: 'Follow-up from Telegamez',
        content: userRequest || 'Hello, we wanted to reach out regarding our previous correspondence.',
      }));
    }

    if (!Array.isArray(sampleEmails) || sampleEmails.length === 0) {
      return NextResponse.json({
        success: true,
        preview: {
          sampleEmails: [],
          message: 'Could not extract email addresses or generate drafts from the conversation',
        },
      });
    }

    return NextResponse.json({
      success: true,
      preview: {
        sampleEmails,
        totalRecipients,
        documentName: document.name,
      },
    });

  } catch (error) {
    console.error('Error generating email campaign preview:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate preview',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
