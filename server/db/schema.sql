-- The complete shape of the database today, in one place, for reading.
--
-- To CHANGE the database, don't edit this file: add a numbered file to
-- db/migrations and run `npm run db:migrate`. Then update this file to match,
-- so it stays an accurate picture.

CREATE TABLE IF NOT EXISTS saved_jobs (
  id           BIGSERIAL PRIMARY KEY,
  company_name TEXT        NOT NULL CHECK (length(company_name) BETWEEN 1 AND 120),
  job_title    TEXT        NOT NULL DEFAULT '' CHECK (length(job_title) <= 160),
  posting_url  TEXT        NOT NULL CHECK (posting_url ~* '^https?://' AND length(posting_url) <= 2000),
  status       TEXT        NOT NULL DEFAULT 'to_apply' CHECK (status IN ('to_apply', 'done')),
  -- How a done job turned out: 'pending' (applied, waiting), 'accepted' or
  -- 'rejected'. Empty while the job is still to apply for (migration 003).
  outcome      TEXT        CHECK (outcome IN ('pending', 'accepted', 'rejected')),
  -- Starred by its owner, for the Favourites filter (migration 004).
  favorite     BOOLEAN     NOT NULL DEFAULT false,
  added_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Whose job this is: the id Supabase Auth gives a signed-in user. Empty for
  -- the sample jobs, which belong to no one. On Supabase it is also linked to
  -- auth.users, so deleting an account deletes its jobs (migration 002).
  user_id      UUID,
  CONSTRAINT saved_jobs_outcome_matches_status
    CHECK ((status = 'to_apply' AND outcome IS NULL) OR (status = 'done' AND outcome IS NOT NULL))
);

-- "One person's jobs, newest first" is the only list the app asks for.
CREATE INDEX IF NOT EXISTS saved_jobs_user_added_idx
  ON saved_jobs (user_id, added_at DESC);

-- Supabase puts a public web API on every table, reachable with the project's
-- public key. Row Level Security blocks that API completely: its roles (anon,
-- authenticated) have no policy, so they see nothing. All access goes through
-- the Express server, where the input is checked.
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

-- The live API logs in as jobstash_app (migration 005), which may only read
-- and write saved_jobs. Its password is set by hand, never in a file.
-- CREATE ROLE jobstash_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
GRANT USAGE ON SCHEMA public TO jobstash_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON saved_jobs TO jobstash_app;
GRANT USAGE ON SEQUENCE saved_jobs_id_seq TO jobstash_app;
CREATE POLICY jobstash_app_all ON saved_jobs FOR ALL TO jobstash_app USING (true) WITH CHECK (true);
