-- 003: what happened after applying.
--
-- status still says where a job is: 'to_apply' or 'done'. outcome says how a
-- done job turned out:
--   'pending'   applied, no answer yet (what "Mark as Done" gives)
--   'accepted'  got it
--   'rejected'  didn't get it
-- A job still to apply for has no outcome (NULL).

ALTER TABLE saved_jobs ADD COLUMN IF NOT EXISTS outcome TEXT;

-- Jobs already marked done before this existed are waiting for an answer.
UPDATE saved_jobs SET outcome = 'pending' WHERE status = 'done' AND outcome IS NULL;

-- Only the three words above, and they must agree with status: no outcome while
-- a job is to apply for, always one once it's done. The database refuses
-- anything else, whatever the website or API sends.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'saved_jobs_outcome_check') THEN
    ALTER TABLE saved_jobs
      ADD CONSTRAINT saved_jobs_outcome_check
      CHECK (outcome IN ('pending', 'accepted', 'rejected'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'saved_jobs_outcome_matches_status') THEN
    ALTER TABLE saved_jobs
      ADD CONSTRAINT saved_jobs_outcome_matches_status
      CHECK ((status = 'to_apply' AND outcome IS NULL) OR (status = 'done' AND outcome IS NOT NULL));
  END IF;
END $$;
