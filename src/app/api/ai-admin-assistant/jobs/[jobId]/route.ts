import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { documentAnalysisQueue } from '@/lib/queues';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    // Get authenticated user
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await context.params;
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
    }

    // Get job from queue
    const job = await documentAnalysisQueue.getJob(jobId);
    
    if (!job) {
      return NextResponse.json({ 
        error: 'Job not found',
        status: 'not_found'
      }, { status: 404 });
    }

    // Check if job belongs to this user
    if (job.data.userEmail !== session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get job status
    const state = await job.getState();
    const progress = job.progress();
    const result = job.returnvalue;
    const failedReason = job.failedReason;

    // Map Bull queue states to our frontend states
    let status = 'pending';
    if (state === 'active') {
      status = 'processing';
    } else if (state === 'completed') {
      status = 'completed';
    } else if (state === 'failed') {
      status = 'error';
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status,
        progress,
        result: state === 'completed' ? result : null,
        error: failedReason || null,
        createdAt: new Date(job.timestamp).toISOString(),
        documentId: job.data.documentId,
        documentName: job.data.documentName,
        analysisTypes: job.data.analysisTypes,
      }
    });
  } catch (error) {
    console.error('Error getting job status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get job status',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}