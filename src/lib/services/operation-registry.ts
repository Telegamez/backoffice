/**
 * Operation Registry
 * Central registry of all supported operations across all services
 * Used for validation during task creation and execution
 */

export interface OperationDefinition {
  service: string;
  operation: string;
  description: string;
  requiredParams?: string[];
  optionalParams?: string[];
}

/**
 * Registry of all supported operations
 * Add new operations here when implementing them
 */
export const OPERATION_REGISTRY: OperationDefinition[] = [
  // Calendar operations
  {
    service: 'calendar',
    operation: 'list_events',
    description: 'List calendar events within a time range',
    requiredParams: [],
    optionalParams: ['timeMin', 'timeMax', 'maxResults', 'timeZone', 'timezone'],
  },
  {
    service: 'calendar',
    operation: 'get_today',
    description: "Get today's calendar events",
    requiredParams: [],
    optionalParams: [],
  },

  // Gmail operations
  {
    service: 'gmail',
    operation: 'send',
    description: 'Send an email',
    requiredParams: ['subject'],
    optionalParams: ['to', 'body', 'html', 'from'],
  },

  // Search operations
  {
    service: 'search',
    operation: 'search',
    description: 'Search the web using Google Search API',
    requiredParams: ['query'],
    optionalParams: ['limit', 'dateRestrict'],
  },
  {
    service: 'search',
    operation: 'web_search',
    description: 'Alias for search operation',
    requiredParams: ['query'],
    optionalParams: ['limit', 'dateRestrict'],
  },
  {
    service: 'search',
    operation: 'trending',
    description: 'Get trending topics for given keywords',
    requiredParams: ['keywords'],
    optionalParams: ['limit'],
  },
  {
    service: 'search',
    operation: 'quotes',
    description: 'Get inspirational quotes',
    requiredParams: [],
    optionalParams: ['limit', 'category'],
  },
  {
    service: 'search',
    operation: 'hacker_news_top',
    description: 'Fetch top stories from Hacker News',
    requiredParams: [],
    optionalParams: ['limit', 'includeFields'],
  },
  {
    service: 'search',
    operation: 'fetch_content',
    description: 'Fetch web page content from URLs',
    requiredParams: ['items'],
    optionalParams: ['fields', 'timeoutSec'],
  },

  // YouTube operations
  {
    service: 'youtube',
    operation: 'search',
    description: 'Search for YouTube videos',
    requiredParams: ['query'],
    optionalParams: ['maxResults', 'limit', 'order', 'publishedAfter', 'regionCode'],
  },
  {
    service: 'youtube',
    operation: 'trending',
    description: 'Get trending YouTube videos',
    requiredParams: [],
    optionalParams: ['maxResults', 'limit', 'regionCode'],
  },
  {
    service: 'youtube',
    operation: 'create_playlist',
    description: 'Create a new YouTube playlist',
    requiredParams: ['title'],
    optionalParams: ['description', 'privacyStatus'],
  },
  {
    service: 'youtube',
    operation: 'search_and_create_playlist',
    description: 'Search for videos and create a playlist with the results',
    requiredParams: ['query', 'playlistTitle'],
    optionalParams: ['playlistDescription', 'maxResults', 'limit'],
  },

  // LLM operations
  {
    service: 'llm',
    operation: 'filter_and_summarize',
    description: 'Filter and summarize data using AI',
    requiredParams: ['inputs'],
    optionalParams: ['filters', 'tone', 'format', 'limit'],
  },
  {
    service: 'llm',
    operation: 'filter_and_rank',
    description: 'Filter and rank items using AI',
    requiredParams: ['inputs'],
    optionalParams: ['filters', 'tone', 'limit', 'criteria'],
  },
  {
    service: 'llm',
    operation: 'summarize',
    description: 'Summarize content using AI',
    requiredParams: ['inputs'],
    optionalParams: ['length', 'perItem', 'includeFields', 'fallbackPolicy'],
  },
  {
    service: 'llm',
    operation: 'format',
    description: 'Format data into a specific output format',
    requiredParams: ['inputs', 'format'],
    optionalParams: ['title', 'itemTemplate'],
  },
  {
    service: 'llm',
    operation: 'filter',
    description: 'Filter items based on keywords and criteria',
    requiredParams: ['inputs'],
    optionalParams: ['filters', 'limit', 'orderBy'],
  },
];

/**
 * Get all operations for a specific service
 */
export function getServiceOperations(service: string): OperationDefinition[] {
  return OPERATION_REGISTRY.filter(op => op.service === service);
}

/**
 * Check if an operation exists for a service
 */
export function isOperationSupported(service: string, operation: string): boolean {
  return OPERATION_REGISTRY.some(
    op => op.service === service && op.operation === operation
  );
}

/**
 * Get operation definition
 */
export function getOperationDefinition(
  service: string,
  operation: string
): OperationDefinition | undefined {
  return OPERATION_REGISTRY.find(
    op => op.service === service && op.operation === operation
  );
}

/**
 * Validate an action against the operation registry
 */
export function validateAction(action: {
  service: string;
  operation: string;
  parameters?: Record<string, unknown>;
}): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if operation exists
  const definition = getOperationDefinition(action.service, action.operation);

  if (!definition) {
    errors.push(
      `Unknown operation: ${action.service}.${action.operation}. ` +
      `This operation is not implemented. Try using 'web_search' instead.`
    );
    return { valid: false, errors, warnings };
  }

  // Check required parameters
  if (definition.requiredParams && action.parameters) {
    for (const param of definition.requiredParams) {
      if (!(param in action.parameters)) {
        errors.push(
          `Missing required parameter '${param}' for ${action.service}.${action.operation}`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get suggestions for alternative operations when one is not found
 */
export function getSuggestedOperations(
  service: string,
  operation: string
): OperationDefinition[] {
  const serviceOps = getServiceOperations(service);

  // If the service exists, return all operations for that service
  if (serviceOps.length > 0) {
    return serviceOps;
  }

  // Otherwise return commonly used operations
  return OPERATION_REGISTRY.filter(op =>
    op.operation.includes('search') ||
    op.operation.includes('get') ||
    op.operation.includes('list')
  ).slice(0, 5);
}
