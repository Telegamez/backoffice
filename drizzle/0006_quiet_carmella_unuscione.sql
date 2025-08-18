CREATE TABLE "admin_assistant_email_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_id" integer,
	"campaign_name" text NOT NULL,
	"source_document_id" text NOT NULL,
	"extraction_results" jsonb NOT NULL,
	"email_template" jsonb NOT NULL,
	"recipient_data" jsonb NOT NULL,
	"delivery_status" jsonb DEFAULT '{}'::jsonb,
	"metrics" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "admin_assistant_email_campaigns_workflow_id_unique" UNIQUE("workflow_id")
);
--> statement-breakpoint
CREATE TABLE "admin_assistant_intent_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_email" text NOT NULL,
	"query_hash" text NOT NULL,
	"query_text" text NOT NULL,
	"detected_intent" jsonb NOT NULL,
	"confidence" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "query_hash_unique" UNIQUE("query_hash")
);
--> statement-breakpoint
CREATE TABLE "admin_assistant_workflow_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"action_type" text NOT NULL,
	"action_name" text NOT NULL,
	"description" text NOT NULL,
	"version" text DEFAULT '1.0' NOT NULL,
	"schema_definition" jsonb NOT NULL,
	"implementation_class" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "admin_assistant_workflow_actions_action_type_unique" UNIQUE("action_type")
);
--> statement-breakpoint
CREATE TABLE "admin_assistant_workflow_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_id" integer,
	"step_name" text NOT NULL,
	"step_order" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"input_data" jsonb DEFAULT '{}'::jsonb,
	"output_data" jsonb DEFAULT '{}'::jsonb,
	"error_details" jsonb DEFAULT '{}'::jsonb,
	"started_at" timestamp,
	"completed_at" timestamp,
	"retry_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "admin_assistant_workflows" ADD COLUMN "workflow_version" text DEFAULT '1.0';--> statement-breakpoint
ALTER TABLE "admin_assistant_workflows" ADD COLUMN "parent_workflow_id" integer;--> statement-breakpoint
ALTER TABLE "admin_assistant_workflows" ADD COLUMN "approval_status" text DEFAULT 'none';--> statement-breakpoint
ALTER TABLE "admin_assistant_workflows" ADD COLUMN "approval_details" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "admin_assistant_workflows" ADD COLUMN "execution_context" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "admin_assistant_email_campaigns" ADD CONSTRAINT "admin_assistant_email_campaigns_workflow_id_admin_assistant_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."admin_assistant_workflows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_assistant_workflow_steps" ADD CONSTRAINT "admin_assistant_workflow_steps_workflow_id_admin_assistant_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."admin_assistant_workflows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_assistant_workflows" ADD CONSTRAINT "admin_assistant_workflows_parent_workflow_id_admin_assistant_workflows_id_fk" FOREIGN KEY ("parent_workflow_id") REFERENCES "public"."admin_assistant_workflows"("id") ON DELETE no action ON UPDATE no action;