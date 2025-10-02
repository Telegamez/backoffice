CREATE TABLE "admin_assistant_workflow_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_id" serial NOT NULL,
	"job_type" varchar(255) NOT NULL,
	"status" varchar(50) NOT NULL,
	"payload" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_assistant_ai_cache" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "admin_assistant_audit" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "admin_assistant_email_campaigns" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "admin_assistant_intent_cache" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "admin_assistant_users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "admin_assistant_workflow_actions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "admin_assistant_workflow_steps" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "github_issues" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "github_pull_requests" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "integration_permissions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "integration_usage" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "segment_insights" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "timeline_segments" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_integrations" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "admin_assistant_ai_cache" CASCADE;--> statement-breakpoint
DROP TABLE "admin_assistant_audit" CASCADE;--> statement-breakpoint
DROP TABLE "admin_assistant_email_campaigns" CASCADE;--> statement-breakpoint
DROP TABLE "admin_assistant_intent_cache" CASCADE;--> statement-breakpoint
DROP TABLE "admin_assistant_users" CASCADE;--> statement-breakpoint
DROP TABLE "admin_assistant_workflow_actions" CASCADE;--> statement-breakpoint
DROP TABLE "admin_assistant_workflow_steps" CASCADE;--> statement-breakpoint
DROP TABLE "github_issues" CASCADE;--> statement-breakpoint
DROP TABLE "github_pull_requests" CASCADE;--> statement-breakpoint
DROP TABLE "integration_permissions" CASCADE;--> statement-breakpoint
DROP TABLE "integration_usage" CASCADE;--> statement-breakpoint
DROP TABLE "segment_insights" CASCADE;--> statement-breakpoint
DROP TABLE "timeline_segments" CASCADE;--> statement-breakpoint
DROP TABLE "user_integrations" CASCADE;--> statement-breakpoint
ALTER TABLE "admin_assistant_workflows" DROP CONSTRAINT "admin_assistant_workflows_parent_workflow_id_admin_assistant_workflows_id_fk";
--> statement-breakpoint
ALTER TABLE "admin_assistant_workflows" ALTER COLUMN "user_email" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "admin_assistant_workflows" ALTER COLUMN "workflow_type" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "admin_assistant_workflows" ALTER COLUMN "status" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "admin_assistant_workflows" ALTER COLUMN "configuration" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "admin_assistant_workflows" ALTER COLUMN "configuration" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_assistant_workflow_jobs" ADD CONSTRAINT "admin_assistant_workflow_jobs_workflow_id_admin_assistant_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."admin_assistant_workflows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_assistant_workflows" DROP COLUMN "source_document_id";--> statement-breakpoint
ALTER TABLE "admin_assistant_workflows" DROP COLUMN "source_document_name";--> statement-breakpoint
ALTER TABLE "admin_assistant_workflows" DROP COLUMN "recipient_count";--> statement-breakpoint
ALTER TABLE "admin_assistant_workflows" DROP COLUMN "emails_sent";--> statement-breakpoint
ALTER TABLE "admin_assistant_workflows" DROP COLUMN "emails_failed";--> statement-breakpoint
ALTER TABLE "admin_assistant_workflows" DROP COLUMN "processing_started";--> statement-breakpoint
ALTER TABLE "admin_assistant_workflows" DROP COLUMN "processing_completed";--> statement-breakpoint
ALTER TABLE "admin_assistant_workflows" DROP COLUMN "results";--> statement-breakpoint
ALTER TABLE "admin_assistant_workflows" DROP COLUMN "workflow_version";--> statement-breakpoint
ALTER TABLE "admin_assistant_workflows" DROP COLUMN "parent_workflow_id";--> statement-breakpoint
ALTER TABLE "admin_assistant_workflows" DROP COLUMN "approval_status";--> statement-breakpoint
ALTER TABLE "admin_assistant_workflows" DROP COLUMN "approval_details";--> statement-breakpoint
ALTER TABLE "admin_assistant_workflows" DROP COLUMN "execution_context";