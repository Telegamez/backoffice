import { NextRequest, NextResponse } from 'next/server';
import { WorkflowManager } from '@/lib/workflow/workflow-manager';
import { auth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> },
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
        { message: 'Workflow ID must be a number' },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { approved, modifications } = body;

    const workflowManager = new WorkflowManager();

    if (approved) {
      await workflowManager.approve(workflowId, modifications);
    } else {
      await workflowManager.reject(workflowId);
    }

    return NextResponse.json({
      success: true,
      message: `Workflow ${workflowId} ${approved ? 'approved and executed' : 'rejected'} successfully`,
    });
  } catch (error) {
    console.error('Error approving workflow:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'An unexpected error occurred.'
      },
      { status: 500 },
    );
  }
}
