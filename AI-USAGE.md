# AI usage

JobStash was built with help from AI. The AI assistant is **Claude Code**
(made by Anthropic). This file shows what I asked it to do, what I kept, where it
was wrong, and which parts I wrote myself.

About **75% of the code was written with AI and about 25% I wrote myself**. I
planned the features, chose the design, tested the app, and decided what to keep.

## 1. How I used AI

### 2026-09-21 - First draft of the API

- **Tool:** Claude Code
- **What I asked for:** A plan for the website and an Express API to save jobs.
- **What it gave back:** A first draft of the server and database files.
- **What I kept, what I changed, and why:** I asked it to go one step at a time and
  to explain in simple words, because I need to understand every file. After that
  we did each part separately, and I checked each part before keeping it.
- **Commit:** https://github.com/EnzoProg-ctrl/JobStash/commit/1a913a8

### 2026-09-27 - Help with the Add Job pop-up

- **Tool:** Claude Code
- **What I asked for:** Help me write the Add Job pop-up myself. I did not want it
  to write the code for me.
- **What it gave back:** Small steps, hints, and a review of my code. It pointed
  out bugs and explained them.
- **What I kept, what I changed, and why:** I wrote the pop-up and the checks for
  the link, company and title myself. I used its advice on the checks. I did it
  this way so the code would be mine.
- **Commit:** https://github.com/EnzoProg-ctrl/JobStash/commit/3ed4769

### 2026-09-28 - Safer API

- **Tool:** Claude Code
- **What I asked for:** Make the API safer.
- **What it gave back:** The `helmet` package (safe settings for the browser) and a
  404 "not found" answer when a job id is not valid, instead of a server error.
- **What I kept, what I changed, and why:** I kept both. A wrong id is a mistake by
  the visitor, not a crash, so 404 is the right answer.
- **Commit:** https://github.com/EnzoProg-ctrl/JobStash/commit/c434cef

### 2026-09-29 - Private lists

- **Tool:** Claude Code
- **What I asked for:** Sign-in, so each person only sees their own jobs.
- **What it gave back:** Database migration files, a `user_id` on every job, and a
  check of the sign-in pass on every API request.
- **What I kept, what I changed, and why:** I kept all of it. I tested it with two
  accounts. Account B could not see A's jobs, and A could not see B's.
- **Commits:** https://github.com/EnzoProg-ctrl/JobStash/commit/b7342f6 and the
  test, https://github.com/EnzoProg-ctrl/JobStash/commit/ce15095

### 2026-09-30 - Google sign-in on the website

- **Tool:** Claude Code
- **What I asked for:** A "Sign in with Google" button, pages that are locked when
  you are signed out, and a sign-out button.
- **What it gave back:** The sign-in code, the locked pages, and the website sending
  the sign-in pass with every request.
- **What I kept, what I changed, and why:** I kept it. I chose Google sign-in
  instead of email links, because free email services need a domain that I do not
  have.
- **Commit:** https://github.com/EnzoProg-ctrl/JobStash/commit/04eac17

### 2026-10-01 - Limits to protect the API

- **Tool:** Claude Code
- **What I asked for:** Protect the API from too much use.
- **What it gave back:** Rate limits, a limit of 1,000 jobs per account, a 5-second
  limit on slow database queries, logs without private data, and a clean shutdown.
- **What I kept, what I changed, and why:** I kept all of it, but two settings were
  wrong at first (see section 2, cases 2 and 3).
- **Commit:** https://github.com/EnzoProg-ctrl/JobStash/commit/a5d615f

### 2026-10-02 - Putting it online

- **Tool:** Claude Code
- **What I asked for:** Help to put the API on Render and the website on Vercel.
- **What it gave back:** The settings for each host, the page-routing rule for
  Vercel, and the list of values to set.
- **What I kept, what I changed, and why:** I arranged the whole deployment myself.
  I made the Render and Vercel accounts, typed in the settings and values, and
  chose the web address (`jobstash-ph.vercel.app`). The AI only told me what to set.
- **Commit:** https://github.com/EnzoProg-ctrl/JobStash/commit/18ab5ac

### 2026-10-03 - Animations

- **Tool:** Claude Code
- **What I asked for:** Smooth pop-ups, menus, and list changes when I filter, sort
  or mark a job as done.
- **What it gave back:** The animation code. It turns animation off for people who
  ask their device for less motion.
- **What I kept, what I changed, and why:** I kept the pop-up and list animations.
  Switching tabs made the screen flicker, so tab switches are instant now (see
  section 2, case 4).
- **Commits:** https://github.com/EnzoProg-ctrl/JobStash/commit/b417bb2 and
  https://github.com/EnzoProg-ctrl/JobStash/commit/7dfe437

### 2026-10-03 - Logo as icons

- **Tool:** Claude Code
- **What I asked for:** My logo design as the browser tab icon, the phone home-screen
  icon, and the picture shown when the link is shared.
- **What it gave back:** SVG and PNG files, made by tracing my design.
- **What I kept, what I changed, and why:** The first try did not look like my
  design and the edges were rough. I asked for a better trace, and we checked it up
  close before I kept it.
- **Commit:** https://github.com/EnzoProg-ctrl/JobStash/commit/4c1eeba

### 2026-10-04 - Kanban board

- **Tool:** Claude Code
- **What I asked for:** My professor asked for a Kanban board, so I asked for a
  board where you can drag cards.
- **What it gave back:** The Board view with four columns, drag and drop that also
  works with a keyboard and a touch screen, and the favourites filter.
- **What I kept, what I changed, and why:** I kept it. I wrote the favourite star
  button myself (see section 3).
- **Commit:** https://github.com/EnzoProg-ctrl/JobStash/commit/9b26782

## 2. Where the AI got it wrong

### Case 1 - The sign-in button did nothing on phones

- **What it gave me:** A bigger decorative blue shape behind the title on the home
  page.
- **What was wrong with it:** The shape sat on top of the "Sign in with Google"
  button and caught the taps, so on a phone nothing happened.
- **What I did instead:** I found this bug myself while using the web app on my
  phone. The shape now ignores touches, and every button was checked at phone
  width.
- **Commit:** https://github.com/EnzoProg-ctrl/JobStash/commit/d18904e

### Case 2 - Wrong rate-limit setting on Render

- **What it gave me:** `TRUST_PROXY=1`, so the rate limit can see each visitor's
  real address.
- **What was wrong with it:** On Render there are more steps in front of the
  server. With `1`, every new connection looked like a new visitor, so the limit
  did not count correctly.
- **What I did instead:** We tested it on the live API and `3` counted correctly,
  even when someone sent a fake address. The code and docs now say 3.
- **Commits:** wrong in https://github.com/EnzoProg-ctrl/JobStash/commit/a5d615f,
  fixed in https://github.com/EnzoProg-ctrl/JobStash/commit/18ab5ac

### Case 3 - A time limit that Supabase ignored

- **What it gave me:** A 5-second limit on database queries, set as an option when
  connecting.
- **What was wrong with it:** Supabase's connection pooler ignores that option, so
  slow queries were not stopped.
- **What I did instead:** The limit is now sent as a command right after each
  connection opens. I tested it on the real database.
- **Commit:** https://github.com/EnzoProg-ctrl/JobStash/commit/a5d615f

### Case 4 - The bottom bar blinked when the list moved

- **What it gave me:** Smooth card animations on My Stash.
- **What was wrong with it:** While the cards moved, they were drawn over the bottom
  bar and the Undo message, so those blinked on phones.
- **What I did instead:** The bar and the Undo message got their own layer, so they
  stay still. Switching tabs is instant now.
- **Commits:** https://github.com/EnzoProg-ctrl/JobStash/commit/169fb25 and
  https://github.com/EnzoProg-ctrl/JobStash/commit/2fe8673

### Case 5 - "Your sign-in expired" after a delete

- **What it gave me:** A rule that any request refused for having no sign-in means
  the sign-in expired.
- **What was wrong with it:** If you sign out during the 5 seconds before a delete
  is sent, the delete has no sign-in pass. The page then said "Your sign-in
  expired" instead of "You've signed out".
- **What I did instead:** The "expired" message only shows if a pass was really
  sent.
- **Commit:** https://github.com/EnzoProg-ctrl/JobStash/commit/4817c4a

## 3. Who wrote what

### Written by me

- **File:** `client/src/components/UndoToast.jsx` and the delete part of
  `client/src/pages/StashPage.jsx` (`handleDelete`, `handleUndo`, `reallyDelete`)
- **Commit:** https://github.com/EnzoProg-ctrl/JobStash/commit/4817c4a
- **What it does and why it is built this way:** When you delete a job, the card
  disappears at once and a small message shows "Deleted ... Undo" for 5 seconds.
  The job is only deleted on the server when the 5 seconds are over. This makes
  Undo simple: stop the timer and put the card back. If you delete another job
  quickly, the first one is deleted for real right away. If you leave the page, the
  waiting job is deleted so it is not forgotten. If the delete fails, the card comes
  back with a message.

- **File:** `client/src/components/StashToolbar.jsx` and the sort part of
  `client/src/pages/StashPage.jsx`
- **Commit:** https://github.com/EnzoProg-ctrl/JobStash/commit/632ed4d
- **What it does and why it is built this way:** The toolbar has the search box and
  the sort choices: newest first, oldest first, and company A to Z. The toolbar does
  not sort anything. It only tells `StashPage` what was typed or picked. `StashPage`
  then filters the jobs by tab and search and sorts a copy of the list. All the jobs
  are already loaded, so searching and sorting do not need a new request to the
  server. The search ignores capital letters and extra spaces.

- **File:** `client/src/components/BottomNav.jsx`
- **Commits:** https://github.com/EnzoProg-ctrl/JobStash/commit/4c76f9c and
  https://github.com/EnzoProg-ctrl/JobStash/commit/2cad204
- **What it does and why it is built this way:** On phones, the main buttons are in
  a bar at the bottom of the screen, where a thumb can reach them: Overview, a big
  round Add Job button, and My Stash. On bigger screens the header has these buttons,
  so the bar is hidden. It also leaves space for the iPhone's bottom swipe line.

- **File:** `client/src/components/AddJobDialog.jsx` (the form and the checks before
  saving)
- **Commit:** https://github.com/EnzoProg-ctrl/JobStash/commit/dd0dd1f
- **What it does and why it is built this way:** When I press Save Job, the form
  does not send anything yet. It trims the spaces and checks all three fields: the
  link must be filled in and be a real web address (http or https), the company
  name is required and at most 120 characters, and the job title is optional and at
  most 160 characters. A problem shows a red message under its field, and nothing is
  sent. If everything is fine, it saves the job and closes the pop-up. The server
  checks the same rules again, because someone could skip the website and call the
  API directly. The website's check is to be friendly, and the server's check is for
  safety.

- **File:** `client/src/components/FavoriteButton.jsx`
- **Commit:** https://github.com/EnzoProg-ctrl/JobStash/commit/9b26782
- **What it does and why it is built this way:** It is the small star on each job
  card. Tap it to make the job a favourite, tap again to remove it. The button only
  shows the star and reports the tap. The page decides what it means and saves it,
  so the button stays small and simple.

- **File:** `client/src/pages/StashPage.jsx`, `JobCard.jsx`, `FilterTabs.jsx` (the My
  Stash page, the job cards and the To Apply / Done / All tabs) and
  `server/db/schema.sql`, `server/jobsRepo.js` (the database)
- **Commits:** https://github.com/EnzoProg-ctrl/JobStash/commit/388d871,
  https://github.com/EnzoProg-ctrl/JobStash/commit/081a7e2 and
  https://github.com/EnzoProg-ctrl/JobStash/commit/1a913a8
- **What it does and why it is built this way:** The My Stash page loads all of the
  person's jobs once. The three tabs (To Apply, Done and All) only choose which jobs
  to show, by looking at each job's status. To Apply shows the jobs still to apply
  for, Done shows the ones I applied to, and All shows everything. The number on each
  tab is how many jobs it has, and it follows the search. The saved jobs table has
  one row per job: the company name (required), the job title (optional), the link,
  the status, an outcome (pending, accepted or rejected, only for done jobs), a
  favourite mark, the date it was added, and the id of the person who owns it. The
  table also has rules, for example the link must start with http or https and the
  company name must be 1 to 120 characters, so wrong data cannot get in even if the
  website's check is skipped.

### The AI-written part I understand best

- **File:** `server/auth.js`
- **Commit:** https://github.com/EnzoProg-ctrl/JobStash/commit/b7342f6
- **What it does and why we kept it:** When someone signs in with Google, Supabase
  gives their browser a "sign-in pass". The website sends it with every request. This
  file checks that the pass really came from Supabase, using Supabase's public keys,
  so the server does not need to keep any secret. Only after the pass is checked does
  the server trust the user id inside it, and every database query uses that id, so
  nobody can ask for someone else's jobs. A bad pass gets a 401 "please sign in
  again". If Supabase cannot be reached, the server answers 503 instead, because that
  is a problem on our side, not the visitor's. We kept it because checking with
  public keys is safer than storing a secret, and I tested it with two accounts.
