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

    // Use AI to generate spreadsheet data based on conversation context
    const { text: sheetDataJson } = await generateText({
      model: openai('gpt-5'),
      prompt: `Based on the conversation below, generate structured data for a Google Sheet.

Conversation Context:
${conversationContext || 'No previous conversation'}

Latest User Request:
${userRequest}

Document Content (first 2000 chars):
${document.content.substring(0, 2000)}

Generate:
1. A suggested title for the spreadsheet
2. Column headers (first row)
3. Data rows based on the document and conversation

Return a JSON object with this structure:
{
  "title": "Suggested Spreadsheet Title",
  "data": [
    ["Header1", "Header2", "Header3"],
    ["Row1Col1", "Row1Col2", "Row1Col3"],
    ["Row2Col1", "Row2Col2", "Row2Col3"]
  ]
}

Extract relevant information from the document and format it appropriately.
Return ONLY the JSON object, no markdown, no code blocks.`,
      temperature: 0.3,
    });

    let sheetPreview;
    try {
      sheetPreview = JSON.parse(sheetDataJson);
    } catch {
      // Fallback
      sheetPreview = {
        title: 'Generated Spreadsheet',
        data: [
          ['Column 1', 'Column 2', 'Column 3'],
          ['Data extracted from document will appear here', '', ''],
        ],
      };
    }

    return NextResponse.json({
      success: true,
      preview: sheetPreview,
    });

  } catch (error) {
    console.error('Error generating sheet preview:', error);
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
