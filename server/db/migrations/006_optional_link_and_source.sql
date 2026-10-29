-- 006: jobs without a link, and where a job was found.
--
-- Not every job has a posting to link to: openings seen offline or in a post,
-- referrals, and companies someone cold-emails. So the link becomes optional
-- (its CHECK still applies whenever there is one), and a short note says where
-- the job came from instead: "Cold email to the hiring manager", "Job fair".
-- Existing jobs keep their links; their source starts empty.

ALTER TABLE saved_jobs ALTER COLUMN posting_url DROP NOT NULL;

ALTER TABLE saved_jobs ADD COLUMN IF NOT EXISTS source TEXT
  CHECK (source IS NULL OR length(source) BETWEEN 1 AND 120);
