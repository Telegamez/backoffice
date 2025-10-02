CREATE TABLE "admin_assistant_ai_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"cache_key" text NOT NULL,
	"cache_value" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_assistant_ai_cache_cache_key_unique" UNIQUE("cache_key")
);
--> statement-breakpoint
CREATE TABLE "admin_assistant_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_email" text NOT NULL,
	"action" text NOT NULL,
	"details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "github_issues" (
	"id" bigint PRIMARY KEY NOT NULL,
	"number" integer NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"state" text NOT NULL,
	"author_login" text,
	"labels_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"html_url" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"closed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "github_pull_requests" (
	"id" bigint PRIMARY KEY NOT NULL,
	"number" integer NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"state" text NOT NULL,
	"author_login" text,
	"merged" integer DEFAULT 0 NOT NULL,
	"html_url" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"closed_at" timestamp,
	"merged_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "integration_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"app_id" text NOT NULL,
	"capability" text NOT NULL,
	"permission_level" text NOT NULL,
	"auto_approved" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "app_capability_unique" UNIQUE("app_id","capability")
);
--> statement-breakpoint
CREATE TABLE "integration_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_email" text NOT NULL,
	"provider_id" text NOT NULL,
	"capability" text NOT NULL,
	"requesting_app" text NOT NULL,
	"operation" text NOT NULL,
	"success" boolean NOT NULL,
	"response_time_ms" integer,
	"error_code" text,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduled_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"schedule_cron" varchar(100) NOT NULL,
	"timezone" varchar(50) DEFAULT 'UTC' NOT NULL,
	"actions" jsonb NOT NULL,
	"personalization" jsonb DEFAULT '{}'::jsonb,
	"enabled" boolean DEFAULT true NOT NULL,
	"status" varchar(50) DEFAULT 'pending_approval' NOT NULL,
	"last_run" timestamp,
	"next_run" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "segment_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"content" text NOT NULL,
	"model" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_executions" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"started_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"status" varchar(50) NOT NULL,
	"result" jsonb,
	"error_message" text,
	"execution_time_ms" integer
);
--> statement-breakpoint
CREATE TABLE "timeline_segments" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"categories" text[] NOT NULL,
	"issues" integer DEFAULT 0 NOT NULL,
	"prs" integer DEFAULT 0 NOT NULL,
	"customer_facing" integer DEFAULT 0 NOT NULL,
	"platform_work" integer DEFAULT 0 NOT NULL,
	"impact" text NOT NULL,
	"deliverables" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"key_work" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "timeline_segments_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_integrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_email" text NOT NULL,
	"provider_id" text NOT NULL,
	"credentials_encrypted" text NOT NULL,
	"scopes" text[] NOT NULL,
	"expires_at" timestamp,
	"last_used" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_provider_unique" UNIQUE("user_email","provider_id")
);
--> statement-breakpoint
ALTER TABLE "task_executions" ADD CONSTRAINT "task_executions_task_id_scheduled_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."scheduled_tasks"("id") ON DELETE cascade ON UPDATE no action;