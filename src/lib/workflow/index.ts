import { actionRegistry } from './action-registry';
import { CandidateExtractionAction } from './actions/candidate-extraction-action';
import { EmailGenerationAction } from './actions/email-generation-action';
import { EmailSendAction } from './actions/email-send-action';

// Register all available workflow actions here
function registerWorkflowActions() {
  actionRegistry.register(new CandidateExtractionAction());
  actionRegistry.register(new EmailGenerationAction());
  actionRegistry.register(new EmailSendAction());
}

// Call the registration function once to populate the registry
registerWorkflowActions();

// Export the registry and manager for use in the application
export { actionRegistry } from './action-registry';
export { WorkflowManager } from './workflow-manager';
