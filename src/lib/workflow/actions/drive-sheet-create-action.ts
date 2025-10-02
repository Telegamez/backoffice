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

const DriveSheetCreateConfigSchema = z.object({
  title: z.string().min(1).optional(),
  data: z.array(z.array(z.string())).optional(),
  conversationContext: z.string().optional(),
  userRequest: z.string().optional(),
});

export class DriveSheetCreateAction extends WorkflowAction {
  readonly actionType = WorkflowActionType.CREATE_SHEET;
  readonly version = '1.0';
  readonly schema = {};

  async execute(
    context: WorkflowContext,
    configuration: unknown
  ): Promise<WorkflowStepResult> {
    console.log(`Executing Google Sheet creation for workflow ${context.workflowId}...`);

    const config = DriveSheetCreateConfigSchema.parse(configuration);
    const driveService = new DriveService(context.userEmail);

    try {
      const result = await driveService.createSheet(config.title, config.data);

      return {
        success: true,
        output: {
          sheetId: result.id,
          webViewLink: result.webViewLink,
          title: config.title,
          rows: config.data.length,
          columns: config.data[0]?.length || 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        output: {
          error: error instanceof Error ? error.message : 'Unknown error creating sheet',
        },
      };
    }
  }

  async validate(configuration: unknown): Promise<ValidationResult> {
    try {
      DriveSheetCreateConfigSchema.parse(configuration);
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
      summary: 'This action creates a new Google Sheet with the specified data.',
      sampleOutput: {
        sheetId: 'example-sheet-id',
        webViewLink: 'https://docs.google.com/spreadsheets/d/...',
      },
    };
  }
}
