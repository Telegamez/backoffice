import {
  WorkflowAction,
  WorkflowActionType,
  WorkflowContext,
  WorkflowStepResult,
  ValidationResult,
  PreviewResult,
} from './base-action';
import { EmailService } from '@/lib/services/email-service';
import { z } from 'zod';

// Define the configuration schema for this action
const EmailSendConfigSchema = z.object({
  // This action might not need its own configuration,
  // as it acts on the results of previous steps.
  batchSize: z.number().min(1).default(10),
  delayBetweenBatches: z.number().min(0).default(1000), // in ms
});

// Define the structure of the input this action expects from previous steps
const EmailDraftSchema = z.object({
  recipient: z.string().email(),
  subject: z.string(),
  content: z.string(),
  cc: z.string().optional(),
});

const ExpectedInputSchema = z.object({
  finalDrafts: z.array(EmailDraftSchema),
});

export class EmailSendAction extends WorkflowAction {
  readonly actionType = WorkflowActionType.EMAIL_SEND; // Using a dedicated type
  readonly version = '1.0';
  readonly schema = EmailSendConfigSchema.parse({});

  async execute(
    context: WorkflowContext,
    _configuration: unknown,
    // This action depends on the output of the approval step
    input: unknown 
  ): Promise<WorkflowStepResult> {
    console.log(`Executing email send for workflow ${context.workflowId}...`);
    
    // const config = EmailSendConfigSchema.parse(configuration);
    const validatedInput = ExpectedInputSchema.parse(input);

    const emailService = new EmailService(context.userEmail);
    const sendResults = [];

    // Simple batching logic for now
    for (const draft of validatedInput.finalDrafts) {
      const result = await emailService.sendEmail(
        { email: draft.recipient },
        { subject: draft.subject, body: draft.content, cc: draft.cc }
      );
      sendResults.push(result);
    }

    return {
      success: true,
      output: {
        sendResults,
        totalSent: sendResults.filter(r => r.success).length,
        totalFailed: sendResults.filter(r => !r.success).length,
      },
    };
  }

  async validate(_configuration: unknown): Promise<ValidationResult> {
    try {
      EmailSendConfigSchema.parse({});
      return { isValid: true };
    } catch (_error) {
      return { isValid: false, errors: ['Invalid configuration for EmailSendAction.'] };
    }
  }

  async preview(_context: WorkflowContext): Promise<PreviewResult> {
    return {
      summary: 'This action sends the approved emails to the final recipients.',
      sampleOutput: {},
    };
  }
}
