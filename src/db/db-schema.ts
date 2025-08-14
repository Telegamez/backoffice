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
  id: serial('id').primaryKey(),
  userEmail: text('user_email').notNull(),
  workflowType: text('workflow_type').notNull(), // 'document_to_email', 'daily_summary', 'bulk_personalization'
  status: text('status').notNull(), // 'pending', 'processing', 'completed', 'failed', 'cancelled'
  sourceDocumentId: text('source_document_id'), // Google Drive file ID
  sourceDocumentName: text('source_document_name'),
  recipientCount: integer('recipient_count').default(0),
  emailsSent: integer('emails_sent').default(0),
  emailsFailed: integer('emails_failed').default(0),
  processingStarted: timestamp('processing_started'),
  processingCompleted: timestamp('processing_completed'),
  configuration: jsonb('configuration').$type<{
    emailTemplate?: string;
    personalizationFields?: string[];
    sendSchedule?: string;
    recipientSource?: string;
    reviewRequired?: boolean;
    metadata?: Record<string, unknown>;
  }>().notNull().default({}),
  results: jsonb('results').$type<{
    analysisResults?: unknown;
    generatedEmails?: Array<{ recipient: string; content: string; status: string }>;
    deliveryStatus?: Record<string, string>;
    errorMessages?: string[];
    metadata?: Record<string, unknown>;
  }>().notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

