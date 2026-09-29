-- 002: each job belongs to one signed-in user.
--
-- user_id is the id Supabase Auth gives a person when they sign in with
-- Google. It is left empty for jobs saved before accounts existed (the sample
-- jobs), so those belong to no one and no signed-in user sees them.

ALTER TABLE saved_jobs ADD COLUMN IF NOT EXISTS user_id UUID;

-- Link it to Supabase's own users table, so a job can't point at a user who
-- doesn't exist, and deleting an account deletes that person's jobs too.
-- auth.users only exists on Supabase, so a plain local PostgreSQL skips this.
DO $$
BEGIN
  IF to_regclass('auth.users') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'saved_jobs_user_id_fkey') THEN
    ALTER TABLE saved_jobs
      ADD CONSTRAINT saved_jobs_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE;
  END IF;
END $$;

-- Every list is now "one person's jobs, newest first". This one index answers
-- that for any number of users, so the two older indexes, which sorted the
-- whole table regardless of owner, are no longer needed.
CREATE INDEX IF NOT EXISTS saved_jobs_user_added_idx
  ON saved_jobs (user_id, added_at DESC);

DROP INDEX IF EXISTS saved_jobs_added_at_idx;
DROP INDEX IF EXISTS saved_jobs_to_apply_idx;
