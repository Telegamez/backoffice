import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db/index';
import { scheduledTasks, taskExecutions } from '@/db/db-schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * GET /api/autonomous-agent/tasks/[id]/history
 * Get execution history for a task
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskIdStr } = await params;
    const taskId = parseInt(taskIdStr, 10);
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    // Verify task exists and belongs to user
    const [task] = await db
      .select()
      .from(scheduledTasks)
      .where(
        and(
          eq(scheduledTasks.id, taskId),
          eq(scheduledTasks.userEmail, session.user.email)
        )
      )
      .limit(1);

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Get execution history
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    const executions = await db
      .select()
      .from(taskExecutions)
      .where(eq(taskExecutions.taskId, taskId))
      .orderBy(desc(taskExecutions.startedAt))
      .limit(limit);

    // Calculate statistics
    const stats = {
      total: executions.length,
      completed: executions.filter(e => e.status === 'completed').length,
      failed: executions.filter(e => e.status === 'failed').length,
      running: executions.filter(e => e.status === 'running').length,
      avgExecutionTime: 0,
    };

    const completedExecutions = executions.filter(
      e => e.status === 'completed' && e.executionTimeMs
    );

    if (completedExecutions.length > 0) {
      const totalTime = completedExecutions.reduce(
        (sum, e) => sum + (e.executionTimeMs || 0),
        0
      );
      stats.avgExecutionTime = Math.round(totalTime / completedExecutions.length);
    }

    return NextResponse.json({
      task: {
        id: task.id,
        name: task.name,
      },
      executions,
      stats,
    });
  } catch (error) {
    console.error('Failed to fetch execution history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch execution history' },
      { status: 500 }
    );
  }
}
