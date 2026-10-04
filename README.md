# JobStash

A digital clipboard for job hunting. Save a job posting link on your phone the
moment you find it, then open the same list on your laptop and actually apply.

**Live site:** https://jobstash-ph.vercel.app (sign in with Google)
**API:** https://jobstash-api.onrender.com (free plan: it sleeps after 15 minutes
without visitors, so the first visit after that can take about a minute)
**Demo video:** not recorded yet

> **Run on your own computer, it starts in demo mode.** The screens are real,
> but your data is kept in your own browser until you connect it to the API.
> See [Demo mode](#demo-mode).

![My Stash: saved jobs with To Apply, Done and All tabs](docs/assets/my-stash.png)


## Contents

1. [Overview](#1-overview)
2. [Setup and installation](#2-setup-and-installation)
3. [How to run it](#3-how-to-run-it)
4. [Features and usage](#4-features-and-usage)
5. [Project structure](#5-project-structure)
6. [Screenshots](#6-screenshots)
7. [Known issues and next steps](#7-known-issues-and-next-steps)
8. [Deploying](#deploying)

## 1. Overview

JobStash is for students who find job openings on their phone between classes
but apply later on a laptop, where their CV is. Paste a job link, add the
company, and it waits in one list until you're ready. Each job is marked
**To Apply** or **Done**, so you can see at a glance what's left.

**Built with:** React, Vite, Tailwind CSS and React Router for the website;
Node.js and Express for the API; PostgreSQL (hosted on Supabase) for the
database.

## 2. Setup and installation

### What to install first

| Tool | Version | Why |
|---|---|---|
| [Node.js](https://nodejs.org) | **20 or newer** (built with 24) | Runs the website tools and the API |
| [Git](https://git-scm.com) | any | To get the code |
| A [Supabase](https://supabase.com) project | free plan | The PostgreSQL database. Only needed for the full version, not for demo mode |

### Get the code

```bash
git clone https://github.com/EnzoProg-ctrl/JobStash.git
cd JobStash
```

The project has two parts, each with its own dependencies. There is nothing to
install at the top level.

```
JobStash/
  client/   the website (React)
  server/   the API (Express)
```

### Install the dependencies

```bash
cd client
npm install
cd ../server
npm install
```

### Environment and configuration

Each part has a `.env.example` listing its settings. Copy it to `.env` and fill
it in. `.env` files are never committed.

```bash
# macOS / Linux
cp client/.env.example client/.env
cp server/.env.example server/.env

# Windows PowerShell
Copy-Item client/.env.example client/.env
Copy-Item server/.env.example server/.env
```

**`server/.env`**

| Name | Example | What it is |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres.abcdefgh:YOUR-PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres` | Your database connection. In Supabase: **Connect > Connection string > Session pooler**, then put your database password in place of `[YOUR-PASSWORD]` (no brackets). **Contains a password: never commit it** |
| `SUPABASE_URL` | `https://your-project-ref.supabase.co` | Your Supabase project's address, used to check sign-in passes. Not a secret. **Dashboard > Project Settings > API** |
| `CORS_ORIGINS` | `http://localhost:5173` | Which websites may call the API. Comma-separated, no trailing slash |
| `NODE_ENV` | `development` | Set to `production` on a host |
| `TRUST_PROXY` | _(leave out locally)_ | Set to `3` on Render, so the rate limits see each visitor's real address (another host may need a different number) |
| `PORT` | _(don't set it)_ | A host sets it for you. Locally the API uses 3000 |

**`client/.env`**

| Name | Example | What it is |
|---|---|---|
| `VITE_USE_MOCK_API` | `true` | `true` (or not set) = demo mode, no server needed. Only the exact word `false` connects to the API |
| `VITE_API_BASE_URL` | `http://localhost:3000` | Where the API is. Ignored in demo mode. No trailing slash |
| `VITE_SUPABASE_URL` | `https://your-project-ref.supabase.co` | Your Supabase project's address, for signing in. Ignored in demo mode |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` | Supabase's **publishable** key, which is safe to show. **Dashboard > Project Settings > API Keys**. Ignored in demo mode |
| `VITE_GOOGLE_CLIENT_ID` | `1234…apps.googleusercontent.com` | The Google OAuth client ID (public). Shows Google's own sign-in button, so Google's screen names this site instead of Supabase's address. Without it, the older redirect button is used |

Every `VITE_` value ends up inside the website's code, where anyone can read it.
Never put a password or a secret in one. The publishable key is made to be
public; the **secret** key (`sb_secret_…`) must never go in the website.

### Set up the database

Only needed for the full version. From `server/`:

```bash
npm run db:migrate  # creates or updates the tables (safe to run again)
npm run db:seed     # adds 6 sample jobs (optional)
```

**How database changes work.** Every change to the database is a numbered file
in `server/db/migrations/` (`001_…`, `002_…`). `npm run db:migrate` runs only
the files that haven't run yet, records each one, and runs each file all or
nothing, so the database is never left half-changed. To change the database,
add the next numbered file; never edit one that has already run.

> ⚠️ **`db:seed` deletes every job in the table first**, then adds the samples.
> Run it once on a new database, never on one with real jobs in it. The same
> goes for `npm run db:reset`, which runs both. As a safety net, both refuse to
> run when `NODE_ENV=production`.

### Set up Google sign-in

Only needed for the full version. People sign in with their Google account, so
JobStash never stores a password.

1. **Google Cloud** ([console.cloud.google.com](https://console.cloud.google.com)):
   create a project, then in **Google Auth Platform** set up the consent screen
   (External) and create an **OAuth client** of type *Web application*:
   - **Authorised JavaScript origins:** `http://localhost` and `http://localhost:5173`
     (Google's sign-in button only works on addresses listed here)
   - **Authorised redirect URIs:** `https://your-project-ref.supabase.co/auth/v1/callback`
2. **Supabase > Authentication > Sign In / Providers > Google:** switch it on
   and paste the client ID and client secret from Google. The secret only goes
   here, never in a file.
3. **Supabase > Authentication > URL Configuration:** set the Site URL to
   `http://localhost:5173` and add `http://localhost:5173/**` to the redirect URLs.
4. While the Google app is in **Testing**, only the people listed under
   **Google Auth Platform > Audience > Test users** can sign in. Add yourself
   there, or click **Publish app** to let anyone in.

## 3. How to run it

### Demo mode (quickest, no database)

```bash
cd client
npm run dev
```

Open **http://localhost:5173**. You should see the landing page, headed
_"Found it on your phone? Stash it. Apply later."_ Click **Try the demo** to
reach **My Stash** with six sample jobs. There's no sign-in in demo mode. You can also go straight to
**http://localhost:5173/stash**. A light blue box at the top says you're in
demo mode.

### The full version (website + API + database)

**1. Start the API.** In one terminal, from `server/`:

```bash
npm run dev
```

It prints `API listening on http://localhost:3000`. Check it before starting
the website:

```bash
curl http://localhost:3000/healthz    # {"ok":true}  -> the API is running
curl http://localhost:3000/readyz     # {"ok":true,"db":"up"}  -> the database is reachable
curl http://localhost:3000/api/jobs   # {"error":"Sign in required"}  -> sign-in is being checked
```

While it runs, each request prints one line, like
`2026-10-01T09:14:03.112Z GET /api/jobs 200 34ms`. The log never includes
sign-in passes, emails, job links or job numbers. **Ctrl+C** (or a host
restarting it) lets requests in progress finish before it stops.

**2. Start the website.** In `client/.env` set `VITE_USE_MOCK_API=false` and
fill in the two `VITE_SUPABASE_` settings, then in a second terminal, from
`client/`:

```bash
npm run dev
```

Open **http://localhost:5173** and click **Sign in with Google**. Google sends
you back to **My Stash**, which is empty for a new account. The demo-mode box
is gone, and the jobs now come from your database.

## 4. Features and usage

### The main flow

1. **Landing page** (`/`) explains what JobStash is and has the
   **Sign in with Google** button. Once you're signed in, the button becomes
   **Go to My Stash** and shows which account you're using.
2. **Your own private list.** Each person only sees the jobs they saved. My
   Stash and the Add Job pop-up are only for signed-in people; anyone else
   who opens `/stash` is sent to the landing page. If a sign-in expires, you
   are sent there too, with a note asking you to sign in again.
3. **Add a job:** click **+ Add Job** in the header. A pop-up opens on top of
   My Stash (address `/stash/add`), with the cursor ready in the link box.
   - **Job posting URL** (required): must be a real `http://` or `https://` link
   - **Company name** (required): 120 characters at most
   - **Job title** (optional): 160 characters at most

   Mistakes show in red under the field before anything is sent. **Save Job**
   shows *Saving…*; if saving fails, the message appears in the pop-up and
   what you typed is kept. After saving, the pop-up closes, the page switches
   to **To Apply**, and the new job is first in the list. Close it with ✕,
   **Cancel**, **Esc**, or a click on the dimmed background. Old links to
   `/add` still work.
4. **My Stash** (`/stash`) is the app's home. Every saved job is a card with:
   - a coloured letter circle for the company
   - the job title and company (if there's no title, the company is shown instead)
   - the website it's from (LinkedIn, Indeed and JobStreet by name, other sites
     by address) and how long ago it was saved
   - a status chip: **To Apply** (blue), or for done jobs **Pending** (applied,
     waiting; blue-grey), **Accepted** (green) or **Rejected** (red)
   - **Open Posting**, which opens the job in a new tab
5. **Tabs** (To Apply, Done, All) filter the list and show how many jobs each
   has. The page opens on To Apply. On **Done**, a second row filters by
   result: **All** (including Pending), **Accepted** or **Rejected**.
6. **Search** filters by job title or company as you type; capitals don't
   matter. The tab counts change to show how many matches each tab has.
   **Sort** orders the list by **Newest first**, **Oldest first** or
   **Company A–Z**.
7. **Favourites.** The ☆ on a card stars the job (★, gold); press it again to
   unstar. **★ Favourites** above the list shows only starred jobs, and the
   tab counts follow, like they do for search. Stars are saved, so they're
   still there next time and on your other devices.
8. **Board view.** The **List | Board** switch above the list turns My Stash
   into a Kanban board with four columns: **To Apply**, **Pending**,
   **Accepted** and **Rejected**, each with its count. Move a job by dragging
   its card to another column:
   - **mouse:** drag the card
   - **phone:** press and hold the card for a moment, then drag (a quick
     swipe still scrolls the page)
   - **keyboard:** Tab to the card's ⠿ button, press **Space**, use the
     **arrow keys** to pick a column, and press **Space** again (**Esc**
     cancels). Screen readers say what's happening at each step.

   Dropping a card saves the change, just like the ⋮ menu (which works on
   board cards too). Search, sort and Favourites still apply; the tabs are
   hidden because the columns replace them. On phones the columns sit side by
   side and scroll sideways; on tablets they're two by two. JobStash remembers
   which view you used last.
9. **The ⋮ menu** on a card records how it's going:

   | Card | Menu |
   |---|---|
   | To Apply | Mark as Done (→ Pending) · Mark as Accepted · Mark as Rejected · Delete Job |
   | Pending | Mark as Accepted · Mark as Rejected · Move back to To Apply · Delete Job |
   | Accepted | Mark as Rejected · Move back to To Apply · Delete Job |
   | Rejected | Mark as Accepted · Move back to To Apply · Delete Job |

   Accepted and Rejected can be picked straight from To Apply; the job moves
   to Done with that result. The card updates straight away. If saving fails,
   it changes back and a message explains why.
   **Delete Job** (in red) removes the card straight away and shows
   *"Deleted "…" · Undo"* for 5 seconds. Only then is the job really deleted,
   so **Undo** brings it back exactly as it was. Deleting another job, or
   leaving My Stash, within the 5 seconds deletes the waiting one at once;
   closing the tab or signing out leaves it in your stash. If deleting fails,
   the card comes back with a message.
10. **When something goes wrong,** the message says so in plain words: the
   API can't be reached, you're offline, too many requests, or the 1,000-job
   limit. If loading takes more than 5 seconds, My Stash explains that the
   server may be waking up (free hosts sleep when nobody uses them), and if
   loading fails there's a **Try again** button.
11. **Overview** (`/overview`) sums up the job hunt: how many jobs are saved,
   to apply and done, a progress bar ("2 of 6 applied"), how many were added
   this week, how many are Pending, Accepted and Rejected, and which job sites
   they come from. On phones it's the left
   button in the bottom bar (Overview · + Add Job · My Stash); on laptops a
   link in the header. My Stash stays the start page.
12. **Privacy** (`/privacy`, linked from the landing page footer and from
   Google's sign-in screen) says in plain words what JobStash keeps, what it
   doesn't do, and how to have your data deleted.
13. **Sign out** in the header ends the sign-in on this browser only, and the
   landing page confirms it. Your other devices stay signed in. On a shared
   computer, sign out when you're done. JobStash's Sign out doesn't sign you
   out of Google itself.

### The API

The website talks only to JobStash's own Express API, which talks to the
database. Every `/api` request needs a Google sign-in, and each person only
ever sees and changes their own jobs. Main routes: `GET /api/jobs` (your
list), `POST /api/jobs` (save), `PATCH /api/jobs/:id` (mark done, accepted,
rejected, or star it), `DELETE /api/jobs/:id`.

**Full reference** (every route, request body, answer code and rule):
[docs/api.md](docs/api.md)

### Demo mode

The website can get its data two ways, chosen by `VITE_USE_MOCK_API` when it's
built:

| `VITE_USE_MOCK_API` | What happens |
|---|---|
| not set, or `true` | **Demo mode.** Data is kept in your browser. No server or database needed, and nothing is shared between visitors or devices |
| `false` | **Full version.** The website calls the API at `VITE_API_BASE_URL`, which reads and writes the real database |

Both give the same results, so the screens don't know which one they're using.
Demo mode is the default so the site still works if the setting is forgotten,
and it's a fallback if the API is asleep during a demo.

## 5. Project structure

```
JobStash/
├── client/                     the website (React, Vite, Tailwind CSS)
│   ├── index.html              page title, icons, link-preview tags
│   ├── public/                 tab and home-screen icons, link-preview image
│   └── src/
│       ├── App.jsx             which page shows at which address
│       ├── pages/              one file per screen: landing, My Stash, Overview, Privacy
│       ├── components/         parts of the screens: job card, board, ⋮ menus, star,
│       │                       Add Job pop-up, bottom bar, status chips, Undo message
│       ├── lib/                sign-in, loading jobs, animations, small helpers
│       └── api/                the only code that fetches data (demo mode or the real API)
├── server/                     the API (Node.js, Express)
│   ├── server.js               the routes and their checks
│   ├── auth.js                 checks the Google sign-in on every /api request
│   ├── jobsRepo.js             the database queries, always for one person
│   ├── limits.js, logging.js   rate limits, and one safe log line per request
│   └── db/migrations/          numbered database changes
├── docs/                       project documents, API reference, deploying, logo, screenshots
└── AI-USAGE.md                 how AI was used in this project
```

## 6. Screenshots

| | |
|---|---|
| ![Landing page](docs/assets/landing.png) | ![My Stash with the To Apply, Done and All tabs](docs/assets/my-stash.png) |
| **Landing page**: what JobStash is, and Sign in with Google | **My Stash**: saved jobs, tabs, search and sort |
| ![The Add Job pop-up](docs/assets/add-job.png) | ![Overview with progress numbers and job sites](docs/assets/overview.png) |
| **Add Job**: paste a link, add the company | **Overview**: progress, results and where jobs come from |

<p align="center">
  <img src="docs/assets/board.png" alt="My Stash as a board with To Apply, Pending, Accepted and Rejected columns" />
  <br />
  <strong>Board view</strong>: drag a job to another column to change it
</p>

<p align="center">
  <img src="docs/assets/phone.png" alt="My Stash on a phone, with the bottom bar" width="280" />
  <br />
  <strong>On a phone</strong>: the bottom bar (Overview · + Add Job · My Stash)
</p>

## 7. Known issues and next steps

**Known issues**
- **Only Google accounts can sign in.** Email sign-in links need an email
  sender with its own domain, which the project doesn't have yet.
- **Google's sign-in screen shows the Supabase address** ("to continue to
  ….supabase.co") instead of "JobStash" until Google approves the app's
  branding. That review has been requested.
- **Free plans:** the API sleeps after 15 minutes without visitors (the next
  visit waits about a minute, and My Stash says so), and Supabase pauses a
  project after 7 days without use (press Resume in its dashboard).
- **`npm run db:seed` wipes the table** (it refuses in production). See [Set up the database](#set-up-the-database).

**Next steps**
1. Finish Google's branding review, so sign-in says "JobStash"
2. Edit a saved job (the API can already do it; the website can't yet)

## Deploying

The live version runs on **Vercel** (website), **Render** (API) and
**Supabase** (database and sign-in), all on free plans, and updates by itself
on every push to `main`. Every setting, the rule for database changes, and a
checklist for moving to a new address: [docs/deploying.md](docs/deploying.md)

## Author

_Laurenzo Centeno_ — @EnzoProg-ctrl (https://github.com/EnzoProg-ctrl)
_APSI - CS401_

## Licence

MIT, see [LICENSE](LICENSE).
