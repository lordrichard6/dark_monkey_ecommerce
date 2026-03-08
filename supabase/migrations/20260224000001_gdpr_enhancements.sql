-- GDPR enhancements:
-- 1. Add 'cancelled' to deletion request statuses
-- 2. Allow users to update (cancel) their own pending requests
-- 3. Add last_export_at to user_profiles

-- Expand the status CHECK constraint to include 'cancelled'
ALTER TABLE data_deletion_requests
  DROP CONSTRAINT IF EXISTS data_deletion_requests_status_check;

ALTER TABLE data_deletion_requests
  ADD CONSTRAINT data_deletion_requests_status_check
  CHECK (status IN ('pending', 'processing', 'completed', 'cancelled'));

-- Allow users to update their own pending deletion requests (needed for cancel)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'data_deletion_requests'
      AND policyname = 'Users can cancel their own pending deletion request'
  ) THEN
    CREATE POLICY "Users can cancel their own pending deletion request"
      ON data_deletion_requests
      FOR UPDATE
      USING  (auth.uid() = user_id AND status = 'pending')
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Track when a user last exported their data
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS last_data_export_at TIMESTAMPTZ;
