import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db/index';
import { scheduledTasks } from '@/db/db-schema';
import { eq, and } from 'drizzle-orm';
import { getScheduler } from '@/lib/services/task-scheduler';
import { z } from 'zod';

const UpdateTaskSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  scheduleCron: z.string().optional(),
  timezone: z.string().optional(),
  enabled: z.boolean().optional(),
  status: z.enum(['pending_approval', 'approved', 'disabled']).optional(),
});

/**
 * GET /api/autonomous-agent/tasks/[id]
 * Get a specific task by ID
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

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Failed to fetch task:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/autonomous-agent/tasks/[id]
 * Update a task
 */
export async function PUT(
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

    const body = await request.json();
    const validation = UpdateTaskSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Verify task exists and belongs to user
    const [existingTask] = await db
      .select()
      .from(scheduledTasks)
      .where(
        and(
          eq(scheduledTasks.id, taskId),
          eq(scheduledTasks.userEmail, session.user.email)
        )
      )
      .limit(1);

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Update task
    const [updatedTask] = await db
      .update(scheduledTasks)
      .set({
        ...validation.data,
        updatedAt: new Date(),
      })
      .where(eq(scheduledTasks.id, taskId))
      .returning();

    // If task was approved and enabled, register with scheduler
    const scheduler = getScheduler();
    if (updatedTask.status === 'approved' && updatedTask.enabled) {
      await scheduler.registerTask(taskId);
    } else if (!updatedTask.enabled) {
      scheduler.unregisterTask(taskId);
    }

    return NextResponse.json({
      task: updatedTask,
      message: 'Task updated successfully',
    });
  } catch (error) {
    console.error('Failed to update task:', error);
    return NextResponse.json(
      {
        error: 'Failed to update task',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/autonomous-agent/tasks/[id]
 * Delete a task
 */
export async function DELETE(
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
    const [existingTask] = await db
      .select()
      .from(scheduledTasks)
      .where(
        and(
          eq(scheduledTasks.id, taskId),
          eq(scheduledTasks.userEmail, session.user.email)
        )
      )
      .limit(1);

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Unregister from scheduler
    const scheduler = getScheduler();
    scheduler.unregisterTask(taskId);

    // Delete task (cascade will delete executions)
    await db
      .delete(scheduledTasks)
      .where(eq(scheduledTasks.id, taskId));

    return NextResponse.json({
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete task:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete task',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
