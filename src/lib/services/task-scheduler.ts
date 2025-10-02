import cron from 'node-cron';
import { db } from '@/db/index';
import { scheduledTasks, taskExecutions } from '@/db/db-schema';
import { eq, and } from 'drizzle-orm';
import { TaskExecutor } from './task-executor';

/**
 * TaskScheduler manages the scheduling and execution of recurring tasks
 * Uses node-cron for cron-based scheduling with timezone support
 */
export class TaskScheduler {
  private scheduledJobs = new Map<number, cron.ScheduledTask>();
  private executor: TaskExecutor;
  private isInitialized = false;

  constructor() {
    this.executor = new TaskExecutor();
  }

  /**
   * Initialize the scheduler by loading all enabled tasks from database
   * Should be called once on server startup
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('TaskScheduler already initialized');
      return;
    }

    if (!db) {
      console.warn('Database not available, scheduler disabled');
      return;
    }

    console.log('Initializing TaskScheduler...');

    try {
      // Load all enabled and approved tasks
      const tasks = await db
        .select()
        .from(scheduledTasks)
        .where(
          and(
            eq(scheduledTasks.enabled, true),
            eq(scheduledTasks.status, 'approved')
          )
        );

      console.log(`Loading ${tasks.length} scheduled tasks`);

      // Register each task with cron
      for (const task of tasks) {
        await this.registerTask(task.id);
      }

      this.isInitialized = true;
      console.log('TaskScheduler initialized successfully');
    } catch (error) {
      console.error('Failed to initialize TaskScheduler:', error);
      throw error;
    }
  }

  /**
   * Register a task with the cron scheduler
   */
  async registerTask(taskId: number): Promise<void> {
    if (!db) return;

    try {
      // Load task from database
      const task = await db
        .select()
        .from(scheduledTasks)
        .where(eq(scheduledTasks.id, taskId))
        .limit(1);

      if (!task || task.length === 0) {
        throw new Error(`Task ${taskId} not found`);
      }

      const taskData = task[0];

      // Validate cron expression
      if (!cron.validate(taskData.scheduleCron)) {
        throw new Error(`Invalid cron expression: ${taskData.scheduleCron}`);
      }

      // Stop existing job if already scheduled
      const existingJob = this.scheduledJobs.get(taskId);
      if (existingJob) {
        existingJob.stop();
        this.scheduledJobs.delete(taskId);
      }

      // Create new cron job
      const cronJob = cron.schedule(
        taskData.scheduleCron,
        async () => {
          console.log(`Executing scheduled task ${taskId}: ${taskData.name}`);
          await this.executeTask(taskId);
        },
        {
          scheduled: true,
          timezone: taskData.timezone,
        }
      );

      this.scheduledJobs.set(taskId, cronJob);

      // Update next run time
      await this.updateNextRun(taskId);

      console.log(`Task ${taskId} registered with schedule: ${taskData.scheduleCron} (${taskData.timezone})`);
    } catch (error) {
      console.error(`Failed to register task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Unregister a task from the scheduler
   */
  unregisterTask(taskId: number): void {
    const job = this.scheduledJobs.get(taskId);
    if (job) {
      job.stop();
      this.scheduledJobs.delete(taskId);
      console.log(`Task ${taskId} unregistered`);
    }
  }

  /**
   * Execute a task immediately (manual trigger or scheduled execution)
   */
  async executeTask(taskId: number): Promise<void> {
    if (!db) return;

    const startTime = Date.now();
    const startedAt = new Date();

    try {
      // Load task data
      const task = await db
        .select()
        .from(scheduledTasks)
        .where(eq(scheduledTasks.id, taskId))
        .limit(1);

      if (!task || task.length === 0) {
        throw new Error(`Task ${taskId} not found`);
      }

      const taskData = task[0];

      // Check if task is enabled
      if (!taskData.enabled) {
        console.log(`Task ${taskId} is disabled, skipping execution`);
        return;
      }

      // Create execution record
      const [execution] = await db
        .insert(taskExecutions)
        .values({
          taskId,
          startedAt,
          status: 'running',
        })
        .returning();

      console.log(`Starting execution ${execution.id} for task ${taskId}`);

      try {
        // Execute the task using TaskExecutor
        const result = await this.executor.execute(taskData);

        const completedAt = new Date();
        const executionTimeMs = Date.now() - startTime;

        // Update execution record with success
        await db
          .update(taskExecutions)
          .set({
            status: 'completed',
            completedAt,
            executionTimeMs,
            result,
          })
          .where(eq(taskExecutions.id, execution.id));

        // Update task last run time
        await db
          .update(scheduledTasks)
          .set({
            lastRun: startedAt,
            updatedAt: new Date(),
          })
          .where(eq(scheduledTasks.id, taskId));

        // Update next run time
        await this.updateNextRun(taskId);

        console.log(`Task ${taskId} execution ${execution.id} completed successfully in ${executionTimeMs}ms`);
      } catch (executionError) {
        const completedAt = new Date();
        const executionTimeMs = Date.now() - startTime;
        const errorMessage = executionError instanceof Error ? executionError.message : String(executionError);

        // Update execution record with failure
        await db
          .update(taskExecutions)
          .set({
            status: 'failed',
            completedAt,
            executionTimeMs,
            errorMessage,
          })
          .where(eq(taskExecutions.id, execution.id));

        console.error(`Task ${taskId} execution ${execution.id} failed:`, executionError);

        // TODO: Implement notification system for critical failures
        // await this.notifyUserOfFailure(taskData.userEmail, taskData.name, errorMessage);
      }
    } catch (error) {
      console.error(`Failed to execute task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Update the next run time for a task based on its cron schedule
   */
  private async updateNextRun(taskId: number): Promise<void> {
    if (!db) return;

    try {
      const task = await db
        .select()
        .from(scheduledTasks)
        .where(eq(scheduledTasks.id, taskId))
        .limit(1);

      if (!task || task.length === 0) return;

      const taskData = task[0];

      // Calculate next run time
      // Note: This is an approximation. For accurate next run time, we'd need a cron parser
      const nextRun = this.calculateNextRun(taskData.scheduleCron, taskData.timezone);

      await db
        .update(scheduledTasks)
        .set({ nextRun })
        .where(eq(scheduledTasks.id, taskId));
    } catch (error) {
      console.error(`Failed to update next run time for task ${taskId}:`, error);
    }
  }

  /**
   * Calculate the next run time for a cron expression
   * Uses manual parsing of cron schedule with timezone support
   */
  private calculateNextRun(cronSchedule: string, timezone: string): Date {
    try {
      // Parse cron: minute hour dayOfMonth month dayOfWeek
      const parts = cronSchedule.trim().split(/\s+/);
      if (parts.length !== 5) {
        throw new Error('Invalid cron format');
      }

      const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

      const scheduleHour = parseInt(hour);
      const scheduleMinute = parseInt(minute);

      if (isNaN(scheduleHour) || isNaN(scheduleMinute)) {
        throw new Error('Invalid hour or minute in cron');
      }

      // Get current time
      const now = new Date();

      // Get the current date/time components in the target timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      const parts_now = formatter.formatToParts(now);
      const nowTz = {
        year: parseInt(parts_now.find(p => p.type === 'year')!.value),
        month: parseInt(parts_now.find(p => p.type === 'month')!.value),
        day: parseInt(parts_now.find(p => p.type === 'day')!.value),
        hour: parseInt(parts_now.find(p => p.type === 'hour')!.value),
        minute: parseInt(parts_now.find(p => p.type === 'minute')!.value),
      };

      // Start with today at the scheduled time
      let candidateYear = nowTz.year;
      let candidateMonth = nowTz.month;
      let candidateDay = nowTz.day;

      // Check if the scheduled time has already passed today
      if (nowTz.hour > scheduleHour || (nowTz.hour === scheduleHour && nowTz.minute >= scheduleMinute)) {
        // Move to tomorrow
        const tomorrow = new Date(candidateYear, candidateMonth - 1, candidateDay + 1);
        candidateYear = tomorrow.getFullYear();
        candidateMonth = tomorrow.getMonth() + 1;
        candidateDay = tomorrow.getDate();
      }

      // Handle dayOfWeek constraint (1-5 = Mon-Fri, etc.)
      if (dayOfWeek !== '*') {
        const allowedDays = dayOfWeek.split(',').map(d => {
          if (d.includes('-')) {
            const [start, end] = d.split('-').map(n => parseInt(n));
            return Array.from({ length: end - start + 1 }, (_, i) => (start + i) % 7);
          }
          return [parseInt(d) % 7];
        }).flat();

        // Find next valid day
        let attempts = 0;
        const maxAttempts = 7;
        while (attempts < maxAttempts) {
          const checkDate = new Date(candidateYear, candidateMonth - 1, candidateDay);
          const dayNum = checkDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

          if (allowedDays.includes(dayNum)) {
            break;
          }

          // Move to next day
          checkDate.setDate(checkDate.getDate() + 1);
          candidateYear = checkDate.getFullYear();
          candidateMonth = checkDate.getMonth() + 1;
          candidateDay = checkDate.getDate();
          attempts++;
        }
      }

      // Create a date string in the target timezone and parse it as UTC
      // Format: YYYY-MM-DDTHH:mm:ss in target timezone
      const tzDateStr = `${candidateYear}-${String(candidateMonth).padStart(2, '0')}-${String(candidateDay).padStart(2, '0')}T${String(scheduleHour).padStart(2, '0')}:${String(scheduleMinute).padStart(2, '0')}:00`;

      // Parse this as if it's in the target timezone and convert to UTC
      const nextRunLocal = new Date(tzDateStr);
      const offsetMs = this.getTimezoneOffset(timezone, nextRunLocal);
      const nextRunUTC = new Date(nextRunLocal.getTime() - offsetMs);

      return nextRunUTC;
    } catch (error) {
      console.error('Error calculating next run:', error);
      // Fallback: return tomorrow at the same time
      const fallback = new Date();
      fallback.setDate(fallback.getDate() + 1);
      return fallback;
    }
  }

  /**
   * Get timezone offset in milliseconds for a given date
   */
  private getTimezoneOffset(timezone: string, date: Date): number {
    // Get the UTC timestamp
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    return tzDate.getTime() - utcDate.getTime();
  }

  /**
   * Get scheduler health status
   */
  getStatus(): { initialized: boolean; activeJobs: number; jobs: Array<{ id: number }> } {
    return {
      initialized: this.isInitialized,
      activeJobs: this.scheduledJobs.size,
      jobs: Array.from(this.scheduledJobs.keys()).map(id => ({ id })),
    };
  }

  /**
   * Shutdown the scheduler gracefully
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down TaskScheduler...');

    // Stop all scheduled jobs
    for (const [taskId, job] of this.scheduledJobs.entries()) {
      job.stop();
      console.log(`Stopped task ${taskId}`);
    }

    this.scheduledJobs.clear();
    this.isInitialized = false;

    console.log('TaskScheduler shut down successfully');
  }
}

// Singleton instance
let schedulerInstance: TaskScheduler | null = null;

/**
 * Get the global scheduler instance
 */
export function getScheduler(): TaskScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new TaskScheduler();
  }
  return schedulerInstance;
}
