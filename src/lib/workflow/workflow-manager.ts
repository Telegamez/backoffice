import { db } from '@/db';
import { adminAssistantWorkflows } from '@/db/db-schema';
import { WorkflowStatus, WorkflowActionType } from './actions/base-action';
import { actionRegistry } from './action-registry';
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
    const newWorkflow = await db
      .insert(adminAssistantWorkflows)
      .values({
        userEmail: params.userEmail,
        workflowType: params.workflowType,
        sourceDocumentId: params.sourceDocumentId,
        configuration: params.configuration,
        status: WorkflowStatus.CREATED,
      })
      .returning();
      
    if (newWorkflow.length === 0) {
      throw new Error('Failed to create workflow record in the database.');
    }

    const workflowId = newWorkflow[0].id;
    
    // 4. (Placeholder) Add the first job to the queue
    // await addWorkflowJob({ workflowId, initialStep: '...' });
    
    console.log(`Workflow ${workflowId} created successfully.`);

    return {
      workflowId,
      status: WorkflowStatus.CREATED,
    };
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
