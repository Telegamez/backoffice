import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

// Define the schema based on the PRD's IntentDetectionResult interface
const IntentDetectionResultSchema = z.object({
  mode: z.enum(['simple', 'workflow']),
  confidence: z.number(),
  inferredAction: z.string().optional(),
  parameters: z.record(z.unknown()),
  requiresClarification: z.boolean(),
});

// Define the request body schema based on the PRD
const IntentDetectionRequestSchema = z.object({
  query: z.string(),
  documentContext: z.object({
    documentId: z.string(),
    documentType: z.string(),
    contentPreview: z.string().optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = IntentDetectionRequestSchema.parse(body);

    const prompt = `
      Based on the user's query and the document context, classify the intent as either 'simple' or 'workflow'.

      User Query: "${validatedData.query}"

      Document Context:
      - Document ID: ${validatedData.documentContext?.documentId || 'Not provided'}
      - Document Type: ${validatedData.documentContext?.documentType || 'Not provided'}

      Classification rules:
      - 'simple': The user is asking a question that requires information retrieval or analysis from the document
        Examples: "What are the emails?", "How many candidates?", "Summarize this document"

      - 'workflow': The user wants to take ACTION on the document data, such as sending emails, creating Google Drive artifacts, or executing tasks
        Examples:
          * Email: "Send emails to...", "Email these candidates", "Create a campaign", "Contact these people"
          * Sheets: "Create a spreadsheet", "Make a sheet", "Export to Google Sheets", "Create a table"
          * Docs: "Create a document", "Make a doc", "Generate a Google Doc", "Write a summary doc"
          * Slides: "Create a presentation", "Make slides", "Generate a deck"

        Key indicators: "send", "email", "contact", "create", "make", "generate", "export", "sheet", "doc", "slide", "spreadsheet", "presentation"

      If mode is 'workflow', set inferredAction based on the request:
      - 'EMAIL_CAMPAIGN' for email-related actions
      - 'CREATE_SHEET' for spreadsheet creation
      - 'CREATE_DOC' for document creation
      - 'CREATE_SLIDE' for presentation creation

      Return your analysis in JSON format matching the schema.
    `;

    const { object: intent } = await generateObject({
      model: openai('gpt-5'),
      schema: IntentDetectionResultSchema,
      prompt,
    });

    return NextResponse.json({
      success: true,
      result: intent,
    });

  } catch (error) {
    console.error('Error in intent detection:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to detect intent' }, { status: 500 });
  }
}
