import { NextResponse } from 'next/server';
import { getScheduler } from '@/lib/services/task-scheduler';

/**
 * GET /api/autonomous-agent/status
 * Get scheduler health status and statistics
 */
export async function GET() {
  try {
    const scheduler = getScheduler();
    const status = scheduler.getStatus();

    return NextResponse.json({
      status: 'healthy',
      scheduler: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
