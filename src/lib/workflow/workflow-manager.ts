import { db } from '@/db';
import { adminAssistantWorkflows } from '@/db/db-schema';
import { WorkflowStatus, WorkflowActionType } from './actions/base-action';
import { actionRegistry } from './action-registry';
import { eq } from 'drizzle-orm';
// Import your queue logic when it's ready
// import { addWorkflowJob } from '@/lib/queues';

interface WorkflowCreationParams {
  userEmail: string;
  workflowType: WorkflowActionType;
  sourceDocumentId: string;
  configuration: Record<string, unknown>;
}

export class WorkflowManager {
  async create(params: WorkflowCreationParams) {
    // 1. Validate workflow type
    const action = actionRegistry.get(params.workflowType);
    if (!action) {
      throw new Error(`Workflow action type '${params.workflowType}' is not registered.`);
    }

    // 2. Validate configuration against the action's schema
    const validationResult = await action.validate(params.configuration);
    if (!validationResult.isValid) {
      throw new Error(`Invalid configuration for workflow: ${validationResult.errors?.join(', ')}`);
    }

    // 3. Create workflow record in the database
    // For email campaigns, set to PENDING_APPROVAL so user can review
    const initialStatus = params.workflowType === WorkflowActionType.EMAIL_CAMPAIGN
      ? WorkflowStatus.PENDING_APPROVAL
      : WorkflowStatus.CREATED;

    const newWorkflow = await db
      .insert(adminAssistantWorkflows)
      .values({
        userEmail: params.userEmail,
        workflowType: params.workflowType,
        sourceDocumentId: params.sourceDocumentId,
        configuration: params.configuration,
        status: initialStatus,
      })
      .returning();

    if (newWorkflow.length === 0) {
      throw new Error('Failed to create workflow record in the database.');
    }

    const workflowId = newWorkflow[0].id;

    console.log(`Workflow ${workflowId} created successfully with status ${initialStatus}.`);

    return {
      workflowId,
      status: initialStatus,
    };
  }

  async approve(workflowId: number, modifications?: { finalDrafts: Array<{ recipientEmail: string; subject: string; content: string }> }) {
    const workflow = await db
      .select()
      .from(adminAssistantWorkflows)
      .where(eq(adminAssistantWorkflows.id, workflowId))
      .limit(1);

    if (workflow.length === 0) {
      throw new Error(`Workflow with ID ${workflowId} not found.`);
    }

    const workflowData = workflow[0];

    // Update status to approved
    await db
      .update(adminAssistantWorkflows)
      .set({ status: WorkflowStatus.APPROVED })
      .where(eq(adminAssistantWorkflows.id, workflowId));

    // Execute the workflow immediately (send emails)
    if (workflowData.workflowType === WorkflowActionType.EMAIL_CAMPAIGN && modifications?.finalDrafts) {
      const EmailSendAction = (await import('./actions/email-send-action')).EmailSendAction;
      const sendAction = new EmailSendAction();

      try {
        await sendAction.execute(
          {
            workflowId,
            userEmail: workflowData.userEmail,
            sourceDocumentId: workflowData.sourceDocumentId,
          },
          workflowData.configuration,
          { finalDrafts: modifications.finalDrafts }
        );

        // Update status to completed
        await db
          .update(adminAssistantWorkflows)
          .set({ status: WorkflowStatus.COMPLETED })
          .where(eq(adminAssistantWorkflows.id, workflowId));
      } catch (error) {
        // Update status to failed
        await db
          .update(adminAssistantWorkflows)
          .set({ status: WorkflowStatus.FAILED })
          .where(eq(adminAssistantWorkflows.id, workflowId));
        throw error;
      }
    }
  }

  async reject(workflowId: number) {
    const workflow = await db
      .select()
      .from(adminAssistantWorkflows)
      .where(eq(adminAssistantWorkflows.id, workflowId))
      .limit(1);

    if (workflow.length === 0) {
      throw new Error(`Workflow with ID ${workflowId} not found.`);
    }

    await db
      .update(adminAssistantWorkflows)
      .set({ status: WorkflowStatus.FAILED })
      .where(eq(adminAssistantWorkflows.id, workflowId));
  }

  // Placeholder for starting the workflow (e.g., after approval)
  async start(workflowId: number) {
    console.log(`Starting workflow ${workflowId}...`);
    // This would change the status and trigger the first real job
  }

  // Placeholder for monitoring workflow status
  async getStatus(workflowId: number) {
    const workflow = await db
      .select({ status: adminAssistantWorkflows.status })
      .from(adminAssistantWorkflows)
      .where({ id: workflowId });

    return workflow.length > 0 ? workflow[0] : null;
  }
}
