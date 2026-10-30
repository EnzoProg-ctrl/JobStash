-- 007: the 5-second limit on slow queries, kept on the API's database account.
--
-- Until now the API set it itself on every new connection (db/pool.js). On
-- Vercel the API connects through Supabase's transaction pooler, which shares
-- a few real database connections between many short-lived copies of the
-- API, so a setting made on one connection doesn't follow the API around.
-- Stored on the account instead, it applies to every connection jobstash_app
-- opens, wherever it comes from.
--
-- Every query in the app takes a few milliseconds, so one that runs longer
-- than 5 seconds is stuck. The database stops it, and the visitor gets a 500
-- instead of waiting forever. Migrations log in as postgres, so they are not
-- limited.

ALTER ROLE jobstash_app SET statement_timeout = '5s';
