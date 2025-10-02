import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db/index';
import { scheduledTasks } from '@/db/db-schema';
import { eq, and } from 'drizzle-orm';
import { getScheduler } from '@/lib/services/task-scheduler';

/**
 * POST /api/autonomous-agent/tasks/[id]/approve
 * Approve a pending task and activate it
 */
export async function POST(
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

    if (task.status !== 'pending_approval') {
      return NextResponse.json(
        { error: 'Task is not pending approval' },
        { status: 400 }
      );
    }

    // Approve and enable task
    const [updatedTask] = await db
      .update(scheduledTasks)
      .set({
        status: 'approved',
        enabled: true,
        updatedAt: new Date(),
      })
      .where(eq(scheduledTasks.id, taskId))
      .returning();

    // Register with scheduler
    const scheduler = getScheduler();
    await scheduler.registerTask(taskId);

    return NextResponse.json({
      task: updatedTask,
      message: 'Task approved and activated successfully',
    });
  } catch (error) {
    console.error('Failed to approve task:', error);
    return NextResponse.json(
      {
        error: 'Failed to approve task',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
