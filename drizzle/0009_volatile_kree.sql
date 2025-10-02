ALTER TABLE "admin_assistant_audit" ADD COLUMN "action_type" text;--> statement-breakpoint
ALTER TABLE "admin_assistant_audit" ADD COLUMN "operation" text;--> statement-breakpoint
ALTER TABLE "admin_assistant_audit" ADD COLUMN "resource_id" text;--> statement-breakpoint
ALTER TABLE "admin_assistant_audit" ADD COLUMN "resource_type" text;--> statement-breakpoint
ALTER TABLE "admin_assistant_audit" ADD COLUMN "success" boolean;--> statement-breakpoint
ALTER TABLE "admin_assistant_audit" ADD COLUMN "response_time_ms" integer;--> statement-breakpoint
ALTER TABLE "admin_assistant_audit" ADD COLUMN "error_message" text;