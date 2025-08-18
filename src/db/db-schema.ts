import { pgTable, serial, text, timestamp, integer, jsonb, bigint, unique, boolean } from 'drizzle-orm/pg-core';

export const timelineSegments = pgTable('timeline_segments', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  startDate: timestamp('start_date', { withTimezone: false }).notNull(),
  endDate: timestamp('end_date', { withTimezone: false }).notNull(),
  categories: text('categories').array().notNull(),
  issues: integer('issues').notNull().default(0),
  prs: integer('prs').notNull().default(0),
  customerFacing: integer('customer_facing').notNull().default(0),
  platformWork: integer('platform_work').notNull().default(0),
  impact: text('impact').notNull(),
  deliverables: jsonb('deliverables').$type<Array<{ title: string; type: string; impact: string }>>().notNull().default([]),
  keyWork: jsonb('key_work').$type<string[]>().notNull().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const githubIssues = pgTable('github_issues', {
  id: bigint('id', { mode: 'number' }).primaryKey(), // GitHub REST id can exceed 32-bit
  number: integer('number').notNull(),
  title: text('title').notNull(),
  body: text('body'),
  state: text('state').notNull(),
  authorLogin: text('author_login'),
  labelsJson: jsonb('labels_json').$type<Array<{ name: string }>>().notNull().default([]),
  htmlUrl: text('html_url').notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull(),
  closedAt: timestamp('closed_at', { withTimezone: false }),
});

export const githubPullRequests = pgTable('github_pull_requests', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  number: integer('number').notNull(),
  title: text('title').notNull(),
  body: text('body'),
  state: text('state').notNull(),
  authorLogin: text('author_login'),
  merged: integer('merged').notNull().default(0),
  htmlUrl: text('html_url').notNull(),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull(),
  closedAt: timestamp('closed_at', { withTimezone: false }),
  mergedAt: timestamp('merged_at', { withTimezone: false }),
});

export const segmentInsights = pgTable('segment_insights', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull(),
  content: text('content').notNull(),
  model: text('model').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userIntegrations = pgTable('user_integrations', {
  id: serial('id').primaryKey(),
  userEmail: text('user_email').notNull(),
  providerId: text('provider_id').notNull(),
  credentialsEncrypted: text('credentials_encrypted').notNull(),
  scopes: text('scopes').array().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: false }),
  lastUsed: timestamp('last_used', { withTimezone: false }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Unique constraint: one integration per user per provider
  userProviderUnique: unique("user_provider_unique").on(table.userEmail, table.providerId)
}));

// Track cross-app integration usage
export const integrationUsage = pgTable('integration_usage', {
  id: serial('id').primaryKey(),
  userEmail: text('user_email').notNull(),
  providerId: text('provider_id').notNull(),
  capability: text('capability').notNull(),
  requestingApp: text('requesting_app').notNull(),
  operation: text('operation').notNull(),              // 'read', 'write', 'sync'
  success: boolean('success').notNull(),
  responseTimeMs: integer('response_time_ms'),
  errorCode: text('error_code'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Control which apps can access which capabilities
export const integrationPermissions = pgTable('integration_permissions', {
  id: serial('id').primaryKey(),
  appId: text('app_id').notNull(),
  capability: text('capability').notNull(),
  permissionLevel: text('permission_level').notNull(),       // 'read', 'write', 'admin'
  autoApproved: boolean('auto_approved').default(false),         // Skip user consent
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // Unique constraint: one permission per app per capability
  appCapabilityUnique: unique("app_capability_unique").on(table.appId, table.capability)
}));

// AI Admin Assistant specific tables
export const adminAssistantUsers = pgTable('admin_assistant_users', {
  id: serial('id').primaryKey(),
  userEmail: text('user_email').notNull(),
  preferences: jsonb('preferences').$type<{
    dailySummaryTime?: string;
    notificationSettings?: {
      emailCompletion?: boolean;
      workflowAlerts?: boolean;
    };
    defaultRecipientSources?: string[];
    aiContentFilters?: {
      minConfidence?: number;
      requireReview?: boolean;
    };
  }>().notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userEmailUnique: unique("user_email_unique").on(table.userEmail)
}));

// Comprehensive audit trail for all AI Admin Assistant actions
export const adminAssistantAudit = pgTable('admin_assistant_audit', {
  id: serial('id').primaryKey(),
  userEmail: text('user_email').notNull(),
  actionType: text('action_type').notNull(), // 'drive_read', 'gmail_send', 'ai_inference', 'document_analyze', 'email_generate'
  resourceId: text('resource_id'), // Drive file ID, Gmail message ID, etc.
  resourceType: text('resource_type'), // 'google_doc', 'google_sheet', 'pdf', 'email_campaign'
  operation: text('operation').notNull(), // 'create', 'read', 'update', 'delete', 'analyze', 'send'
  details: jsonb('details').$type<{
    fileName?: string;
    recipientCount?: number;
    aiModel?: string;
    processingTime?: number;
    confidence?: number;
    errorMessage?: string;
    metadata?: Record<string, unknown>;
  }>().notNull().default({}),
  success: boolean('success').notNull(),
  responseTimeMs: integer('response_time_ms'),
  errorCode: text('error_code'),
  errorMessage: text('error_message'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// AI inference result caching
export const adminAssistantAiCache = pgTable('admin_assistant_ai_cache', {
  id: serial('id').primaryKey(),
  resourceId: text('resource_id').notNull(), // Drive file ID or content hash
  resourceType: text('resource_type').notNull(), // 'drive_doc', 'drive_sheet', 'pdf', 'email_draft'
  inferenceType: text('inference_type').notNull(), // 'summary', 'key_points', 'contacts', 'tasks', 'email_personalization'
  inputHash: text('input_hash').notNull(), // Hash of input parameters for cache invalidation
  result: jsonb('result').$type<{
    summary?: string;
    keyPoints?: string[];
    contacts?: Array<{ name: string; email: string; role?: string }>;
    tasks?: string[];
    confidence?: number;
    emailContent?: string;
    personalizationVariables?: Record<string, string>;
    metadata?: Record<string, unknown>;
  }>().notNull(),
  aiModel: text('ai_model').notNull(), // 'gpt-5', 'gpt-4-fallback'
  confidence: integer('confidence'), // 0-100 confidence score
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(), // 30-day default retention
}, (table) => ({
  // Unique constraint for cache key
  cacheKeyUnique: unique("cache_key_unique").on(table.resourceId, table.inferenceType, table.inputHash)
}));

// Document workflow tracking
export const adminAssistantWorkflows = pgTable('admin_assistant_workflows', {
  // Existing fields from the original table definition
  id: serial('id').primaryKey(),
  userEmail: text('user_email').notNull(),
  workflowType: text('workflow_type').notNull(),
  status: text('status').notNull(),
  sourceDocumentId: text('source_document_id'),
  sourceDocumentName: text('source_document_name'),
  recipientCount: integer('recipient_count').default(0),
  emailsSent: integer('emails_sent').default(0),
  emailsFailed: integer('emails_failed').default(0),
  processingStarted: timestamp('processing_started'),
  processingCompleted: timestamp('processing_completed'),
  configuration: jsonb('configuration').$type<any>().notNull().default({}),
  results: jsonb('results').$type<any>().notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  
  // New columns from PRD
  workflowVersion: text('workflow_version').default('1.0'),
  parentWorkflowId: integer('parent_workflow_id').references(() => adminAssistantWorkflows.id),
  approvalStatus: text('approval_status').default('none'), // 'none', 'pending', 'approved', 'rejected'
  approvalDetails: jsonb('approval_details').default({}),
  executionContext: jsonb('execution_context').default({}),
});

// Intent detection cache table from PRD
export const adminAssistantIntentCache = pgTable('admin_assistant_intent_cache', {
  id: serial('id').primaryKey(),
  userEmail: text('user_email').notNull(),
  queryHash: text('query_hash').notNull(),
  queryText: text('query_text').notNull(),
  detectedIntent: jsonb('detected_intent').notNull(),
  confidence: integer('confidence').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),

}, (table) => ({
  queryHashUnique: unique("query_hash_unique").on(table.queryHash)
}));

// Workflow action definitions from PRD
export const adminAssistantWorkflowActions = pgTable('admin_assistant_workflow_actions', {
  id: serial('id').primaryKey(),
  actionType: text('action_type').notNull().unique(),
  actionName: text('action_name').notNull(),
  description: text('description').notNull(),
  version: text('version').notNull().default('1.0'),
  schemaDefinition: jsonb('schema_definition').notNull(),
  implementationClass: text('implementation_class').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Workflow execution steps from PRD
export const adminAssistantWorkflowSteps = pgTable('admin_assistant_workflow_steps', {
  id: serial('id').primaryKey(),
  workflowId: integer('workflow_id').references(() => adminAssistantWorkflows.id),
  stepName: text('step_name').notNull(),
  stepOrder: integer('step_order').notNull(),
  status: text('status').notNull().default('pending'), // 'pending', 'running', 'completed', 'failed', 'skipped'
  inputData: jsonb('input_data').default({}),
  outputData: jsonb('output_data').default({}),
  errorDetails: jsonb('error_details').default({}),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  retryCount: integer('retry_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Email campaign specific data from PRD
export const adminAssistantEmailCampaigns = pgTable('admin_assistant_email_campaigns', {
  id: serial('id').primaryKey(),
  workflowId: integer('workflow_id').references(() => adminAssistantWorkflows.id).unique(),
  campaignName: text('campaign_name').notNull(),
  sourceDocumentId: text('source_document_id').notNull(),
  extractionResults: jsonb('extraction_results').notNull(),
  emailTemplate: jsonb('email_template').notNull(),
  recipientData: jsonb('recipient_data').notNull(),
  deliveryStatus: jsonb('delivery_status').default({}),
  metrics: jsonb('metrics').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

