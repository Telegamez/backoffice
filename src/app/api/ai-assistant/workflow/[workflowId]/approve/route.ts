import { NextRequest, NextResponse } from 'next/server';
import { WorkflowManager } from '@/lib/workflow/workflow-manager';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> },
) {
  try {
    const { workflowId: workflowIdStr } = await params;
    const workflowId = parseInt(workflowIdStr, 10);

    if (isNaN(workflowId)) {
      return NextResponse.json(
        { message: 'Workflow ID must be a number' },
        { status: 400 },
      );
    }

    const workflowManager = new WorkflowManager();
    await workflowManager.approve(workflowId);

    return NextResponse.json({
      message: `Workflow ${workflowId} approved successfully`,
    });
  } catch (error) {
    console.error('Error approving workflow:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
