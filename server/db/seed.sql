-- Sample data for development.
--
-- This starts with TRUNCATE. That is correct on a laptop and catastrophic
-- against the database a live demo depends on. Check which DATABASE_URL is
-- loaded before running it.

TRUNCATE TABLE saved_jobs RESTART IDENTITY CASCADE;

INSERT INTO saved_jobs (company_name, job_title, posting_url, status, added_at) VALUES
  ('Brightside Co.',
   'Frontend Intern',
   'https://www.linkedin.com/jobs/view/4011223344',
   'to_apply', now() - interval '2 days'),
  ('Northwind Labs',
   'IT Support Associate',
   'https://northwind.example.com/careers/it-support-associate',
   'to_apply', now() - interval '4 days'),
  ('Harbour Analytics',
   'Data Analyst Intern',
   'https://ph.indeed.com/viewjob?jk=9f2c1a77bd40e510',
   'to_apply', now() - interval '6 days'),
  ('Quill & Type',
   'Marketing Assistant (Work From Home, 20 hours a week, open to students taking evening classes)',
   'https://www.jobstreet.com.ph/job/78451236',
   'to_apply', now() - interval '8 days'),
  ('Meridian Software',
   'Junior QA Tester',
   'https://careers.meridian.example.org/postings/junior-qa-tester',
   'done', now() - interval '11 days'),
  ('Cassava Studio',
   '',
   'https://cassava.example.net/jobs/1042',
   'done', now() - interval '14 days');

-- Two of these are deliberately awkward: one job title long enough to find every
-- text-wrapping bug, and one row with no title at all, because the form allows
-- saving a link before you know what the role is called.
