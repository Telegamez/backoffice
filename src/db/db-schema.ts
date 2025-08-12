import { pgTable, serial, text, timestamp, integer, jsonb, bigint } from 'drizzle-orm/pg-core';

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


