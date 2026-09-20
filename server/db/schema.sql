-- The complete shape of the database. Safe to run against an empty database,
-- and safe to run twice.
--
-- This file is committed on purpose. The schema is a fact about the
-- application, not a runtime concern: it should be readable by opening a file
-- rather than by connecting to a server.

CREATE TABLE IF NOT EXISTS saved_jobs (
  id           BIGSERIAL PRIMARY KEY,
  company_name TEXT        NOT NULL CHECK (length(company_name) BETWEEN 1 AND 120),
  job_title    TEXT        NOT NULL DEFAULT '' CHECK (length(job_title) <= 160),
  posting_url  TEXT        NOT NULL CHECK (posting_url ~* '^https?://' AND length(posting_url) <= 2000),
  status       TEXT        NOT NULL DEFAULT 'to_apply' CHECK (status IN ('to_apply', 'done')),
  added_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- My Stash always sorts newest first. Without this the database reads every row
-- and sorts it on each request.
CREATE INDEX IF NOT EXISTS saved_jobs_added_at_idx
  ON saved_jobs (added_at DESC);

-- The filter tabs query by status, and a partial index on the common case is
-- cheaper than one covering rows nobody filters for.
CREATE INDEX IF NOT EXISTS saved_jobs_to_apply_idx
  ON saved_jobs (added_at DESC)
  WHERE status = 'to_apply';

-- TODO (once accounts exist): add user_id and make every query filter on it.
--   ALTER TABLE saved_jobs ADD COLUMN user_id TEXT NOT NULL;
--   CREATE INDEX saved_jobs_user_idx ON saved_jobs (user_id, added_at DESC);
-- Until then this table holds one shared list, so the deployed app must not be
-- described as private.
