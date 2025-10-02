import {
  WorkflowAction,
  WorkflowActionType,
  WorkflowContext,
  WorkflowStepResult,
  ValidationResult,
  PreviewResult,
} from './base-action';
import { DriveService } from '@/lib/services/drive-service';
import { z } from 'zod';

const DriveDocCreateConfigSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  conversationContext: z.string().optional(),
  userRequest: z.string().optional(),
});

export class DriveDocCreateAction extends WorkflowAction {
  readonly actionType = WorkflowActionType.CREATE_DOC;
  readonly version = '1.0';
  readonly schema = {};

  async execute(
    context: WorkflowContext,
    configuration: unknown
  ): Promise<WorkflowStepResult> {
    console.log(`Executing Google Doc creation for workflow ${context.workflowId}...`);

    const config = DriveDocCreateConfigSchema.parse(configuration);
    const driveService = new DriveService(context.userEmail);

    try {
      const result = await driveService.createDoc(config.title, config.content);

      return {
        success: true,
        output: {
          docId: result.id,
          webViewLink: result.webViewLink,
          title: config.title,
          contentLength: config.content.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        output: {
          error: error instanceof Error ? error.message : 'Unknown error creating document',
        },
      };
    }
  }

  async validate(configuration: unknown): Promise<ValidationResult> {
    try {
      DriveDocCreateConfigSchema.parse(configuration);
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
      summary: 'This action creates a new Google Doc with the specified content.',
      sampleOutput: {
        docId: 'example-doc-id',
        webViewLink: 'https://docs.google.com/document/d/...',
      },
    };
  }
}
