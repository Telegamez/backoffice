import { WorkflowAction, WorkflowActionType } from './actions/base-action';

// A simple in-memory registry for workflow actions
const registry = new Map<WorkflowActionType, WorkflowAction>();

export const actionRegistry = {
  register(action: WorkflowAction): void {
    if (registry.has(action.actionType)) {
      console.warn(`Workflow action type ${action.actionType} is already registered. Overwriting.`);
    }
    registry.set(action.actionType, action);
  },

  get(actionType: WorkflowActionType): WorkflowAction | undefined {
    return registry.get(actionType);
  },

  list(): WorkflowAction[] {
    return Array.from(registry.values());
  },
};

// Example of how a future action would be registered:
// import { EmailCampaignAction } from './actions/email-campaign-action';
// actionRegistry.register(new EmailCampaignAction());
