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

    // Use AI to generate document content based on conversation context
    const { text: docDataJson } = await generateText({
      model: openai('gpt-5'),
      prompt: `Based on the conversation below, generate content for a Google Doc.

Conversation Context:
${conversationContext || 'No previous conversation'}

Latest User Request:
${userRequest}

Document Content (first 2000 chars):
${document.content.substring(0, 2000)}

Generate:
1. A suggested title for the document
2. Well-formatted content based on the request and source document

Return a JSON object with this structure:
{
  "title": "Suggested Document Title",
  "content": "The full text content of the document with proper formatting and structure"
}

Create professional, well-structured content that addresses the user's request.
Return ONLY the JSON object, no markdown, no code blocks.`,
      temperature: 0.5,
    });

    let docPreview;
    try {
      docPreview = JSON.parse(docDataJson);
    } catch {
      // Fallback
      docPreview = {
        title: 'Generated Document',
        content: 'Document content based on your source will appear here.',
      };
    }

    return NextResponse.json({
      success: true,
      preview: docPreview,
    });

  } catch (error) {
    console.error('Error generating doc preview:', error);
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
