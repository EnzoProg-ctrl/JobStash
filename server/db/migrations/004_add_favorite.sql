-- 004: favourite jobs.
--
-- A job can be starred, so the ones that matter most are easy to find (the
-- Favourites filter in My Stash). Every job starts unstarred.

ALTER TABLE saved_jobs ADD COLUMN IF NOT EXISTS favorite BOOLEAN NOT NULL DEFAULT false;
