-- Make action column nullable in admin_assistant_audit table
-- The code uses action_type instead of action
ALTER TABLE "admin_assistant_audit" ALTER COLUMN "action" DROP NOT NULL;
