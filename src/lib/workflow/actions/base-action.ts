// Type definitions based on the PRD

export enum WorkflowActionType {
  CANDIDATE_EXTRACTION = 'candidate_extraction',
  EMAIL_GENERATION = 'email_generation', // Added for specificity
  EMAIL_SEND = 'email_send', // Added for the final send step
  EMAIL_CAMPAIGN = 'email_campaign',
  DOCUMENT_SUMMARY = 'document_summary',
  BULK_PERSONALIZATION = 'bulk_personalization',
}

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

export enum StepType {
  DOCUMENT_ANALYSIS = 'document_analysis',
  DATA_EXTRACTION = 'data_extraction',
  AI_GENERATION = 'ai_generation',
  VALIDATION = 'validation',
  APPROVAL_GATE = 'approval_gate',
  EMAIL_SEND = 'email_send',
  NOTIFICATION = 'notification',
}

// Basic interfaces for context, results, and validation
export interface WorkflowContext {
  userEmail: string;
  workflowId: string;
  sourceDocumentId: string;
}

export interface WorkflowStepResult {
  success: boolean;
  output?: Record<string, unknown>;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
}

export interface PreviewResult {
  // Define what a preview looks like, e.g., sample data or a description
  summary: string;
  sampleOutput?: Record<string, unknown>;
}

// Abstract class for all workflow actions, based on the PRD's Action Registry Pattern
export abstract class WorkflowAction {
  abstract readonly actionType: WorkflowActionType;
  abstract readonly version: string;
  
  // A JSON schema for configuration validation (can be simple for now)
  abstract readonly schema: Record<string, unknown>; 

  abstract execute(
    context: WorkflowContext,
    configuration: unknown
  ): Promise<WorkflowStepResult>;
  
  abstract validate(configuration: unknown): Promise<ValidationResult>;

  abstract preview(context: WorkflowContext): Promise<PreviewResult>;
}
