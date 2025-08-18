import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { adminAssistantWorkflows } from '@/db/db-schema';
import { eq } from 'drizzle-orm';
import { WorkflowStatus, WorkflowActionType } from '@/lib/workflow/actions/base-action';
import { z } from 'zod';
// Assuming you will create a generic workflow queue
// import { addWorkflowJob } from '@/lib/queues';

// Schema for the approval request body, based on the PRD
const WorkflowApprovalRequestSchema = z.object({
  approved: z.boolean(),
  modifications: z.record(z.unknown()).optional(),
  comments: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workflowId = parseInt(params.workflowId, 10);
    if (isNaN(workflowId)) {
      return NextResponse.json({ error: 'Invalid workflow ID' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = WorkflowApprovalRequestSchema.parse(body);

    // Update the workflow status in the database
    const newStatus = validatedData.approved ? WorkflowStatus.APPROVED : WorkflowStatus.REJECTED;

    const updatedWorkflow = await db
      .update(adminAssistantWorkflows)
      .set({
        status: newStatus,
        approvalDetails: {
          approvedBy: session.user.email,
          approvedAt: new Date().toISOString(),
          modifications: validatedData.modifications,
          comments: validatedData.comments,
        },
      })
      .where(eq(adminAssistantWorkflows.id, workflowId))
      .returning();

    if (updatedWorkflow.length === 0) {
      return NextResponse.json({ error: 'Workflow not found or failed to update' }, { status: 404 });
    }

    // If approved, trigger the email send action
    if (newStatus === WorkflowStatus.APPROVED) {
      // In a real implementation, you would add a job to the queue here.
      // This job would execute the EmailSendAction.
      console.log(`Workflow ${workflowId} approved. Adding 'email_send' job to the queue...`);
      // await addWorkflowJob({
      //   workflowId,
      //   actionType: WorkflowActionType.EMAIL_SEND,
      //   input: {
      //     finalDrafts: validatedData.modifications?.finalDrafts,
      //   },
      // });
    }

    return NextResponse.json({ success: true, newStatus });

  } catch (error) {
    console.error(`Error approving workflow ${params.workflowId}:`, error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to process approval' }, { status: 500 });
  }
}
