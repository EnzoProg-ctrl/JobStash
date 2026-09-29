-- 001: the saved_jobs table as it was first built.
--
-- Safe on a database that already has it (everything is IF NOT EXISTS), which
-- is how it was added to the live database after the table already existed.

CREATE TABLE IF NOT EXISTS saved_jobs (
  id           BIGSERIAL PRIMARY KEY,
  company_name TEXT        NOT NULL CHECK (length(company_name) BETWEEN 1 AND 120),
  job_title    TEXT        NOT NULL DEFAULT '' CHECK (length(job_title) <= 160),
  posting_url  TEXT        NOT NULL CHECK (posting_url ~* '^https?://' AND length(posting_url) <= 2000),
  status       TEXT        NOT NULL DEFAULT 'to_apply' CHECK (status IN ('to_apply', 'done')),
  added_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS saved_jobs_added_at_idx
  ON saved_jobs (added_at DESC);

CREATE INDEX IF NOT EXISTS saved_jobs_to_apply_idx
  ON saved_jobs (added_at DESC)
  WHERE status = 'to_apply';

-- Supabase puts a public web API on every table, reachable with the project's
-- public key. Row Level Security with no policies blocks that API completely.
-- The Express server is not affected: it connects as the postgres user, which
-- bypasses RLS.
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;
