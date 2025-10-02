import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  jsonb,
  bigint,
  unique,
  boolean,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

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
  deliverables: jsonb('deliverables')
    .$type<Array<{ title: string; type: string; impact: string }>>()
    .notNull()
    .default([]),
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
  labelsJson: jsonb('labels_json')
    .$type<Array<{ name: string }>>()
    .notNull()
    .default([]),
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

export const userIntegrations = pgTable(
  'user_integrations',
  {
    id: serial('id').primaryKey(),
    userEmail: text('user_email').notNull(),
    providerId: text('provider_id').notNull(),
    credentialsEncrypted: text('credentials_encrypted').notNull(),
    scopes: text('scopes').array().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: false }),
    lastUsed: timestamp('last_used', { withTimezone: false }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Unique constraint: one integration per user per provider
    userProviderUnique: unique('user_provider_unique').on(
      table.userEmail,
      table.providerId,
    ),
  }),
);

// Track cross-app integration usage
export const integrationUsage = pgTable('integration_usage', {
  id: serial('id').primaryKey(),
  userEmail: text('user_email').notNull(),
  providerId: text('provider_id').notNull(),
  capability: text('capability').notNull(),
  requestingApp: text('requesting_app').notNull(),
  operation: text('operation').notNull(), // 'read', 'write', 'sync'
  success: boolean('success').notNull(),
  responseTimeMs: integer('response_time_ms'),
  errorCode: text('error_code'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Control which apps can access which capabilities
export const integrationPermissions = pgTable(
  'integration_permissions',
  {
    id: serial('id').primaryKey(),
    appId: text('app_id').notNull(),
    capability: text('capability').notNull(),
    permissionLevel: text('permission_level').notNull(), // 'read', 'write', 'admin'
    autoApproved: boolean('auto_approved').default(false), // Skip user consent
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    // Unique constraint: one permission per app per capability
    appCapabilityUnique: unique('app_capability_unique').on(
      table.appId,
      table.capability,
    ),
  }),
);

export const adminAssistantAiCache = pgTable('admin_assistant_ai_cache', {
  id: serial('id').primaryKey(),
  cacheKey: text('cache_key').notNull().unique(),
  cacheValue: jsonb('cache_value').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const adminAssistantAudit = pgTable('admin_assistant_audit', {
  id: serial('id').primaryKey(),
  userEmail: text('user_email').notNull(),
  actionType: text('action_type').notNull(),
  resourceId: text('resource_id'),
  resourceType: text('resource_type'),
  operation: text('operation').notNull(),
  details: jsonb('details').notNull().default({}),
  success: boolean('success').notNull(),
  responseTimeMs: integer('response_time_ms'),
  errorCode: text('error_code'),
  errorMessage: text('error_message'),
  timestamp: timestamp('timestamp', { withTimezone: false }).notNull().defaultNow(),
});

export const adminAssistantWorkflows = pgTable('admin_assistant_workflows', {
  id: serial('id').primaryKey(),
  userEmail: varchar('user_email', { length: 255 }).notNull(),
  workflowType: varchar('workflow_type', { length: 255 }).notNull(),
  sourceDocumentId: varchar('source_document_id', { length: 255 }),
  status: varchar('status', { length: 50 }).notNull(),
  configuration: jsonb('configuration'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const adminAssistantWorkflowsRelations = relations(
  adminAssistantWorkflows,
  ({ many }) => ({
    jobs: many(adminAssistantWorkflowJobs),
  }),
);

export const adminAssistantWorkflowJobs = pgTable(
  'admin_assistant_workflow_jobs',
  {
    id: serial('id').primaryKey(),
    workflowId: serial('workflow_id')
      .notNull()
      .references(() => adminAssistantWorkflows.id),
    jobType: varchar('job_type', { length: 255 }).notNull(),
    status: varchar('status', { length: 50 }).notNull(),
    payload: jsonb('payload'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
);

export const adminAssistantWorkflowJobsRelations = relations(
  adminAssistantWorkflowJobs,
  ({ one }) => ({
    workflow: one(adminAssistantWorkflows, {
      fields: [adminAssistantWorkflowJobs.workflowId],
      references: [adminAssistantWorkflows.id],
    }),
  }),
);

// Autonomous Agent Scheduler Tables
export const scheduledTasks = pgTable('scheduled_tasks', {
  id: serial('id').primaryKey(),
  userEmail: varchar('user_email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  scheduleCron: varchar('schedule_cron', { length: 100 }).notNull(),
  timezone: varchar('timezone', { length: 50 }).notNull().default('UTC'),
  actions: jsonb('actions')
    .$type<
      Array<{
        type: 'data_collection' | 'processing' | 'delivery';
        service: string;
        operation: string;
        parameters: Record<string, unknown>;
        outputBinding?: string;
      }>
    >()
    .notNull(),
  personalization: jsonb('personalization')
    .$type<{
      tone?: 'motivational' | 'professional' | 'casual';
      keywords?: string[];
      filters?: Record<string, unknown>;
    }>()
    .default({}),
  enabled: boolean('enabled').notNull().default(true),
  status: varchar('status', { length: 50 })
    .notNull()
    .default('pending_approval'),
  lastRun: timestamp('last_run', { withTimezone: false }),
  nextRun: timestamp('next_run', { withTimezone: false }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const taskExecutions = pgTable('task_executions', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id')
    .notNull()
    .references(() => scheduledTasks.id, { onDelete: 'cascade' }),
  startedAt: timestamp('started_at', { withTimezone: false }).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: false }),
  status: varchar('status', { length: 50 }).notNull(),
  result: jsonb('result').$type<Record<string, unknown>>(),
  errorMessage: text('error_message'),
  executionTimeMs: integer('execution_time_ms'),
});

export const scheduledTasksRelations = relations(scheduledTasks, ({ many }) => ({
  executions: many(taskExecutions),
}));

export const taskExecutionsRelations = relations(taskExecutions, ({ one }) => ({
  task: one(scheduledTasks, {
    fields: [taskExecutions.taskId],
    references: [scheduledTasks.id],
  }),
}));
