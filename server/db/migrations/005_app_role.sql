-- 005: a limited database account for the API.
--
-- Until now the API logged in as postgres, which owns everything and skips
-- Row Level Security. jobstash_app can only read, add, change and delete rows
-- in saved_jobs: it can't create or drop tables, see Supabase's own tables
-- (auth.users and the rest) or touch schema_migrations. If the API were ever
-- tricked into running the wrong SQL, that is all it could reach.
--
-- No password here: this file is public. The password is set by hand
-- (ALTER ROLE jobstash_app PASSWORD '…') and only goes into Render's
-- DATABASE_URL. Migrations still run as postgres, from your own computer.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'jobstash_app') THEN
    CREATE ROLE jobstash_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO jobstash_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON saved_jobs TO jobstash_app;
GRANT USAGE ON SEQUENCE saved_jobs_id_seq TO jobstash_app;

-- Row Level Security stays on, and still lets Supabase's public roles (anon,
-- authenticated) see nothing. This policy lets only jobstash_app through. Which
-- rows belong to whom is the API's job: every query has AND user_id = $n.
DROP POLICY IF EXISTS jobstash_app_all ON saved_jobs;
CREATE POLICY jobstash_app_all ON saved_jobs
  FOR ALL TO jobstash_app
  USING (true)
  WITH CHECK (true);
