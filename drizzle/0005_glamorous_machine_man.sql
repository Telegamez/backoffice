CREATE TABLE "admin_assistant_ai_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"resource_id" text NOT NULL,
	"resource_type" text NOT NULL,
	"inference_type" text NOT NULL,
	"input_hash" text NOT NULL,
	"result" jsonb NOT NULL,
	"ai_model" text NOT NULL,
	"confidence" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "cache_key_unique" UNIQUE("resource_id","inference_type","input_hash")
);
--> statement-breakpoint
CREATE TABLE "admin_assistant_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_email" text NOT NULL,
	"action_type" text NOT NULL,
	"resource_id" text,
	"resource_type" text,
	"operation" text NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"success" boolean NOT NULL,
	"response_time_ms" integer,
	"error_code" text,
	"error_message" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_assistant_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_email" text NOT NULL,
	"preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("user_email")
);
--> statement-breakpoint
CREATE TABLE "admin_assistant_workflows" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_email" text NOT NULL,
	"workflow_type" text NOT NULL,
	"status" text NOT NULL,
	"source_document_id" text,
	"source_document_name" text,
	"recipient_count" integer DEFAULT 0,
	"emails_sent" integer DEFAULT 0,
	"emails_failed" integer DEFAULT 0,
	"processing_started" timestamp,
	"processing_completed" timestamp,
	"configuration" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"results" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
