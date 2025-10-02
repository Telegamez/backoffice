-- Fix admin_assistant_audit table schema mismatches
ALTER TABLE "admin_assistant_audit" ADD COLUMN IF NOT EXISTS "error_code" text;

-- Rename created_at to timestamp to match schema
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_assistant_audit' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE "admin_assistant_audit" RENAME COLUMN "created_at" TO "timestamp";
  END IF;
END $$;
