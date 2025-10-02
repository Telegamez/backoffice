import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { validateAction, getSuggestedOperations, OPERATION_REGISTRY } from './operation-registry';

/**
 * Schema for parsing natural language task prompts into structured task definitions
 */
const TaskInterpretationSchema = z.object({
  name: z.string().describe('A short, descriptive name for the task'),
  description: z.string().describe('A brief description of what the task does'),
  schedule: z.object({
    cron: z.string().describe('Cron expression (e.g., "0 7 * * *" for daily at 7am)'),
    timezone: z.string().describe('IANA timezone (e.g., "America/Los_Angeles")'),
    naturalLanguage: z.string().describe('Human-readable schedule description'),
  }),
  actions: z.array(
    z.object({
      type: z.enum(['data_collection', 'processing', 'delivery']).describe('Action type'),
      service: z.string().describe('Service name: calendar, gmail, search, youtube, llm'),
      operation: z.string().describe('Operation to perform on the service'),
      parameters: z.record(z.any()).describe('Parameters for the operation'),
      outputBinding: z.string().optional().describe('Variable name to store result'),
    })
  ),
  personalization: z.object({
    tone: z.enum(['motivational', 'professional', 'casual']).optional(),
    keywords: z.array(z.string()).optional().describe('Keywords to filter/highlight'),
    filters: z.record(z.any()).optional(),
  }),
});

export type TaskInterpretation = z.infer<typeof TaskInterpretationSchema>;

/**
 * TaskParser converts natural language prompts into structured task definitions
 * Uses OpenAI GPT models for interpretation
 */
export class TaskParser {
  /**
   * Parse a natural language prompt into a structured task definition
   */
  async parsePrompt(prompt: string, userEmail?: string): Promise<TaskInterpretation> {
    try {
      const { object } = await generateObject({
        model: openai('gpt-5'),
        schema: TaskInterpretationSchema,
        prompt: this.buildPrompt(prompt, userEmail),
        temperature: 0.1, // Low temperature for more consistent parsing
      });

      // Validate cron expression
      this.validateCronExpression(object.schedule.cron);

      // Normalize and validate actions
      this.validateActions(object.actions);

      return object;
    } catch (error) {
      console.error('Failed to parse task prompt:', error);
      throw new Error(`Task parsing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Build the prompt for the LLM
   */
  private buildPrompt(userPrompt: string, userEmail?: string): string {
    // Get list of available operations grouped by service
    const operationsByService = OPERATION_REGISTRY.reduce((acc, op) => {
      if (!acc[op.service]) acc[op.service] = [];
      acc[op.service].push(op.operation);
      return acc;
    }, {} as Record<string, string[]>);

    const availableOps = Object.entries(operationsByService)
      .map(([service, ops]) => `  - ${service}: ${ops.join(', ')}`)
      .join('\n');

    return `You are a task interpretation assistant. Parse the following user request into a structured scheduled task.

IMPORTANT: You MUST ONLY use operations that are listed below. Do NOT invent new operations.

Available Operations by Service:
${availableOps}

User Request: "${userPrompt}"

Your job is to:
1. Extract the schedule/timing (convert natural language to cron expression)
2. Identify data sources needed (Calendar, Gmail, Google Search, YouTube, etc.)
3. Determine what processing is needed (filtering, summarization, formatting)
4. Identify the delivery method (email, document, etc.)
5. Extract personalization preferences (tone, keywords, filters)

Guidelines:
- For cron expressions:
  * "every morning at 7am" = "0 7 * * *"
  * "every Monday at 9am" = "0 9 * * 1"
  * "daily at 6pm" = "0 18 * * *"
  * "every weekday at 8am" = "0 8 * * 1-5"
- Common timezones: America/Los_Angeles, America/New_York, Europe/London, UTC
- Break down the task into sequential actions:
  * data_collection: Gather data from sources
  * processing: Filter, summarize, or transform data
  * delivery: Send via email, save to doc, etc.
- Use outputBinding to pass data between actions (e.g., "calendar_events", "trending_items")
- For email delivery, use the service "gmail" and operation "send"
- For trending topics, combine search from multiple sources if mentioned

Example actions structure:
[
  {
    "type": "data_collection",
    "service": "calendar",
    "operation": "list_events",
    "parameters": {"timeMin": "today", "timeMax": "today+24h"},
    "outputBinding": "calendar_events"
  },
  {
    "type": "data_collection",
    "service": "search",
    "operation": "trending",
    "parameters": {"sources": ["google", "youtube"], "limit": 10},
    "outputBinding": "trending_items"
  },
  {
    "type": "processing",
    "service": "llm",
    "operation": "filter_and_summarize",
    "parameters": {
      "inputs": ["calendar_events", "trending_items"],
      "filters": ["AI", "startups"],
      "tone": "motivational",
      "format": "email_html"
    },
    "outputBinding": "email_content"
  },
  {
    "type": "delivery",
    "service": "gmail",
    "operation": "send",
    "parameters": {
      "to": "${userEmail || 'user@example.com'}",
      "subject": "Your Daily Briefing - {{date}}",
      "body": "{{email_content}}"
    }
  }
]

Personalization:
- tone: Extract from phrases like "motivational", "professional", "casual", "friendly"
- keywords: Extract topics/keywords the user cares about (e.g., "AI", "Telegames", "startups")
- filters: Any specific filtering criteria mentioned

Parse the user request above and return a structured task definition.`;
  }

  /**
   * Validate cron expression format
   */
  private validateCronExpression(cron: string): void {
    // Basic cron validation: 5 or 6 fields separated by spaces
    const parts = cron.trim().split(/\s+/);

    if (parts.length < 5 || parts.length > 6) {
      throw new Error(
        `Invalid cron expression: "${cron}". Must have 5 or 6 fields (minute hour day month weekday [year])`
      );
    }

    // Validate each field has valid characters
    const cronPattern = /^[0-9*,\-/]+$/;
    for (const part of parts) {
      if (!cronPattern.test(part)) {
        throw new Error(`Invalid cron field: "${part}". Only numbers, *, -, /, and , are allowed.`);
      }
    }
  }

  /**
   * Validate and normalize actions
   */
  private validateActions(actions: TaskInterpretation['actions']): void {
    if (actions.length === 0) {
      throw new Error('Task must have at least one action');
    }

    // Ensure at least one delivery action
    const hasDelivery = actions.some(a => a.type === 'delivery');
    if (!hasDelivery) {
      throw new Error('Task must have at least one delivery action');
    }

    // Validate service names
    const validServices = ['calendar', 'gmail', 'search', 'youtube', 'llm', 'drive', 'docs', 'sheets'];
    for (const action of actions) {
      if (!validServices.includes(action.service)) {
        throw new Error(`Unknown service: ${action.service}. Valid services: ${validServices.join(', ')}`);
      }
    }

    // Validate operations exist in the registry
    for (const action of actions) {
      const validation = validateAction(action);
      if (!validation.valid) {
        const suggestions = getSuggestedOperations(action.service, action.operation);
        const suggestionText = suggestions.length > 0
          ? `\n\nAvailable operations for ${action.service}: ${suggestions.map(s => s.operation).join(', ')}`
          : '\n\nConsider using web_search for search operations.';

        throw new Error(
          `${validation.errors.join(', ')}${suggestionText}`
        );
      }
    }
  }

  /**
   * Generate a preview of what the task will do
   * Used for user confirmation before approval
   */
  generatePreview(interpretation: TaskInterpretation): string {
    const lines: string[] = [];

    lines.push(`Task: ${interpretation.name}`);
    lines.push(`Description: ${interpretation.description}`);
    lines.push('');
    lines.push(`Schedule: ${interpretation.schedule.naturalLanguage}`);
    lines.push(`  (${interpretation.schedule.cron} in ${interpretation.schedule.timezone})`);
    lines.push('');
    lines.push('Actions:');

    for (let i = 0; i < interpretation.actions.length; i++) {
      const action = interpretation.actions[i];
      lines.push(`  ${i + 1}. ${action.type}: ${action.service}.${action.operation}`);

      if (action.outputBinding) {
        lines.push(`     → Saves result to: ${action.outputBinding}`);
      }
    }

    if (interpretation.personalization.tone || interpretation.personalization.keywords) {
      lines.push('');
      lines.push('Personalization:');

      if (interpretation.personalization.tone) {
        lines.push(`  Tone: ${interpretation.personalization.tone}`);
      }

      if (interpretation.personalization.keywords && interpretation.personalization.keywords.length > 0) {
        lines.push(`  Keywords: ${interpretation.personalization.keywords.join(', ')}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Validate that a parsed task can be executed
   * Checks for required API access, valid parameters, etc.
   */
  async validateTask(interpretation: TaskInterpretation): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for required API scopes based on services used
    const services = new Set(interpretation.actions.map(a => a.service));

    if (services.has('calendar')) {
      // TODO: Check if user has authorized Calendar API
      warnings.push('Ensure you have authorized Google Calendar access');
    }

    if (services.has('gmail')) {
      warnings.push('Ensure you have authorized Gmail access');
    }

    if (services.has('youtube')) {
      warnings.push('YouTube integration may have rate limits (10,000 quota units/day)');
    }

    if (services.has('search')) {
      warnings.push('Google Search API has a limit of 100 queries/day on free tier');
    }

    // Validate delivery actions have required parameters
    const deliveryActions = interpretation.actions.filter(a => a.type === 'delivery');
    for (const action of deliveryActions) {
      if (action.service === 'gmail' && action.operation === 'send') {
        if (!action.parameters.subject) {
          errors.push('Email delivery requires a subject');
        }
        if (!action.parameters.body && !action.parameters.body?.includes('{{')) {
          warnings.push('Email body should reference data from previous actions');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
