// Type definitions based on the PRD

export enum WorkflowStatus {
  CREATED = 'created',
  QUEUED = 'queued',
  PROCESSING = 'processing',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum WorkflowActionType {
  CANDIDATE_EXTRACTION = 'candidate_extraction',
  EMAIL_GENERATION = 'email_generation',
  EMAIL_SEND = 'email_send',
  EMAIL_CAMPAIGN = 'email_campaign',
  DOCUMENT_SUMMARY = 'document_summary',
  BULK_PERSONALIZATION = 'bulk_personalization',
}

export interface WorkflowValidationResult {
  isValid: boolean;
  errors?: string[];
}

export abstract class WorkflowAction {
  abstract validate(
    configuration: Record<string, unknown>,
  ): Promise<WorkflowValidationResult>;
  abstract execute(
    workflowId: number,
    configuration: Record<string, unknown>,
  ): Promise<void>;
}
