import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { WorkflowManager } from '@/lib/workflow/workflow-manager';
import { z } from 'zod';
import { WorkflowActionType } from '@/lib/workflow/actions/base-action';

// Schema for the workflow creation request, based on the PRD
const WorkflowCreateRequestSchema = z.object({
  workflowType: z.nativeEnum(WorkflowActionType),
  sourceDocumentId: z.string(),
  configuration: z.record(z.unknown()),
  reviewRequired: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = WorkflowCreateRequestSchema.parse(body);

    const workflowManager = new WorkflowManager();
    
    const result = await workflowManager.create({
      userEmail: session.user.email,
      workflowType: validatedData.workflowType,
      sourceDocumentId: validatedData.sourceDocumentId,
      configuration: validatedData.configuration,
    });

    return NextResponse.json({
      success: true,
      workflowId: result.workflowId,
      // These are placeholders as per the PRD
      estimatedCompletionTime: '5 minutes', 
      jobIds: [], 
    });

  } catch (error) {
    console.error('Error creating workflow:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create workflow', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
