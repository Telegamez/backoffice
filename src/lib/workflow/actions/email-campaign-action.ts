import {
  WorkflowAction,
  WorkflowActionType,
  WorkflowContext,
  WorkflowStepResult,
  ValidationResult,
  PreviewResult,
} from './base-action';
import { z } from 'zod';

const EmailCampaignConfigSchema = z.object({
  conversationContext: z.string().optional(),
  userRequest: z.string().optional(),
});

export class EmailCampaignAction extends WorkflowAction {
  readonly actionType = WorkflowActionType.EMAIL_CAMPAIGN;
  readonly version = '1.0';
  readonly schema = EmailCampaignConfigSchema.parse({});

  async execute(
    context: WorkflowContext,
    _configuration: unknown
  ): Promise<WorkflowStepResult> {
    console.log(`Executing email campaign for workflow ${context.workflowId}...`);

    // Email sending is handled separately in the approval flow
    // This action just validates the workflow can be created
    return {
      success: true,
      output: {
        message: 'Email campaign workflow created successfully',
      },
    };
  }

  async validate(configuration: unknown): Promise<ValidationResult> {
    try {
      EmailCampaignConfigSchema.parse(configuration);
      return { isValid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { isValid: false, errors: error.errors.map(e => e.message) };
      }
      return { isValid: false, errors: ['An unknown validation error occurred.'] };
    }
  }

  async preview(_context: WorkflowContext): Promise<PreviewResult> {
    return {
      summary: 'This action creates an email campaign workflow.',
      sampleOutput: {
        message: 'Email campaign ready for review',
      },
    };
  }
}
