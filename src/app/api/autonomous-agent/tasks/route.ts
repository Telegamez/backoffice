import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db/index';
import { scheduledTasks } from '@/db/db-schema';
import { eq, desc } from 'drizzle-orm';
import { TaskParser } from '@/lib/services/task-parser';
// import { getScheduler } from '@/lib/services/task-scheduler';
import { z } from 'zod';

const CreateTaskSchema = z.object({
  prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
  recipients: z.array(z.string().email()).optional(),
});

/**
 * GET /api/autonomous-agent/tasks
 * List all tasks for the authenticated user
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const userTasks = await db
      .select()
      .from(scheduledTasks)
      .where(eq(scheduledTasks.userEmail, session.user.email))
      .orderBy(desc(scheduledTasks.createdAt));

    return NextResponse.json({
      tasks: userTasks,
      count: userTasks.length,
    });
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/autonomous-agent/tasks
 * Create a new task from a natural language prompt
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const body = await request.json();
    const validation = CreateTaskSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { prompt, recipients } = validation.data;

    // Parse natural language prompt
    const parser = new TaskParser();
    const interpretation = await parser.parsePrompt(prompt, session.user.email);

    // Override email recipients and sender if provided
    if (recipients && recipients.length > 0) {
      interpretation.actions = interpretation.actions.map((action) => {
        if (action.service === 'gmail' && action.operation === 'send') {
          return {
            ...action,
            parameters: {
              ...action.parameters,
              to: recipients,
              from: 'tele@telegames.ai',
            },
          };
        }
        return action;
      });
    }

    // Validate the parsed task
    const taskValidation = await parser.validateTask(interpretation);

    if (!taskValidation.valid) {
      return NextResponse.json(
        {
          error: 'Task validation failed',
          errors: taskValidation.errors,
          warnings: taskValidation.warnings,
        },
        { status: 400 }
      );
    }

    // Create task in database (pending approval)
    const [newTask] = await db
      .insert(scheduledTasks)
      .values({
        userEmail: session.user.email,
        name: interpretation.name,
        description: interpretation.description,
        scheduleCron: interpretation.schedule.cron,
        timezone: interpretation.schedule.timezone,
        actions: interpretation.actions,
        personalization: interpretation.personalization,
        enabled: false, // Start disabled until approved
        status: 'pending_approval',
      })
      .returning();

    // Generate preview
    const preview = parser.generatePreview(interpretation);

    return NextResponse.json({
      task: newTask,
      interpretation,
      preview,
      validation: taskValidation,
      message: 'Task created successfully. Please review and approve to activate.',
    });
  } catch (error) {
    console.error('Failed to create task:', error);
    return NextResponse.json(
      {
        error: 'Failed to create task',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
