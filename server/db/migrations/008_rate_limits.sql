-- 008: rate-limit counts, shared by every copy of the API.
--
-- On Vercel the API runs as several short-lived copies at once. Counting
-- requests in each copy's memory would let someone spread a flood across
-- copies and never hit a limit, so the counts live here instead
-- (rateLimitStore.js).
--
-- One row per limit and visitor: `key` is the limit's name plus a scrambled
-- code made from the visitor's internet address or account (never the
-- address itself), `hits` is how many requests so far, and `reset_at` is when
-- the count starts again. Rows whose time is up are deleted every minute or
-- so, so the table stays tiny.

CREATE TABLE IF NOT EXISTS rate_limits (
  key      TEXT        PRIMARY KEY,
  hits     INTEGER     NOT NULL,
  reset_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS rate_limits_reset_at_idx ON rate_limits (reset_at);

-- Only the API's own account may use it. Supabase's public roles (anon,
-- authenticated) get nothing, the same as saved_jobs.
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON rate_limits FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON rate_limits TO jobstash_app;

DROP POLICY IF EXISTS jobstash_app_all ON rate_limits;
CREATE POLICY jobstash_app_all ON rate_limits
  FOR ALL TO jobstash_app
  USING (true)
  WITH CHECK (true);
