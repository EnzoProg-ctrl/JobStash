# JobStash

A digital clipboard for job hunting. Save a job posting link on your phone the
moment you find it, then open the same list on your laptop and actually apply.

**Live demo:** https://enzoprog-ctrl.github.io/JobStash/ (demo mode: no server or database behind it)
**Full version:** not deployed yet (planned: Vercel for the website, a free Node host for the API)
**Demo video:** not recorded yet

> **This app runs in demo mode by default.** The screens are real, but unless
> you connect it to the API, your data is kept in your own browser. See
> [Demo mode](#demo-mode).

![My Stash: saved jobs with To Apply, Done and All tabs](docs/assets/my-stash.png)


## Contents

1. [Overview](#1-overview)
2. [Setup and installation](#2-setup-and-installation)
3. [How to run it](#3-how-to-run-it)
4. [Features and usage](#4-features-and-usage)
5. [Project structure](#5-project-structure)
6. [Known issues and next steps](#6-known-issues-and-next-steps)

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
   - **Authorised JavaScript origins:** `http://localhost:5173`
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
   - a **To Apply** or **Done** badge
   - **Open Posting**, which opens the job in a new tab
5. **Tabs** (To Apply, Done, All) filter the list and show how many jobs each
   has. The page opens on To Apply.
6. **Search** filters by job title or company as you type; capitals don't
   matter. The tab counts change to show how many matches each tab has.
   **Sort** orders the list by **Newest first**, **Oldest first** or
   **Company A–Z**.
7. **The ⋮ menu** on a card marks the job **done**, or moves a done job **back
   to To Apply**. The card updates straight away. If saving fails, it changes
   back and a message explains why.
   **Delete** (in red) removes the card straight away and shows
   *"Deleted "…" · Undo"* for 5 seconds. Only then is the job really deleted,
   so **Undo** brings it back exactly as it was. Deleting another job, or
   leaving My Stash, within the 5 seconds deletes the waiting one at once;
   closing the tab or signing out leaves it in your stash. If deleting fails,
   the card comes back with a message.
8. **When something goes wrong,** the message says so in plain words: the
   API can't be reached, you're offline, too many requests, or the 1,000-job
   limit. If loading takes more than 5 seconds, My Stash explains that the
   server may be waking up (free hosts sleep when nobody uses them), and if
   loading fails there's a **Try again** button.
9. **Privacy** (`/privacy`, linked from the landing page footer and from
   Google's sign-in screen) says in plain words what JobStash keeps, what it
   doesn't do, and how to have your data deleted.
10. **Sign out** in the header ends the sign-in on this browser only, and the
   landing page confirms it. Your other devices stay signed in. On a shared
   computer, sign out when you're done. JobStash's Sign out doesn't sign you
   out of Google itself.

### The API

All responses are JSON. Errors come back as `{"error": "what went wrong"}`.

**Every `/api` request needs a sign-in pass.** The website signs people in with
Google through Supabase Auth, and sends the pass it gets as
`Authorization: Bearer <pass>`. The API checks it against the Supabase
project's **public** keys (so the server holds no secret for this), and takes
the user's id from it. Every query then includes `AND user_id = …`, so each
person only ever sees and changes their own jobs.

| Answer | When |
|---|---|
| `401` | No pass, a pass that isn't valid or has expired, or an account that was deleted |
| `404` | The job doesn't exist, **or belongs to someone else** (the same answer, so nothing leaks) |
| `503` | The API couldn't reach Supabase to check the pass |
| `409` | Saving a new job when the account already has 1,000, the most one account can keep |
| `429` | Too many requests: more than 100 a minute from one device, or more than 50 new jobs an hour from one account. The `RateLimit` header says how many seconds to wait |

| Method | Path | What it does |
|---|---|---|
| `GET` | `/healthz` | Is the API running? `{"ok":true}` (no sign-in needed) |
| `GET` | `/readyz` | Can it reach the database? `{"ok":true,"db":"up"}`, or `503` if not (no sign-in needed) |
| `GET` | `/api/jobs` | Your jobs, newest first |
| `GET` | `/api/jobs?status=to_apply` | Only jobs still to apply for (`?status=done` for finished ones) |
| `GET` | `/api/jobs/:id` | One of your jobs, or `404` |
| `POST` | `/api/jobs` | Save a job. Returns `201` and the new job |
| `PUT` | `/api/jobs/:id` | Replace a job's details |
| `PATCH` | `/api/jobs/:id` | Change only the status. Body: `{"status":"done"}` |
| `DELETE` | `/api/jobs/:id` | Delete a job. Returns `204` |

A job looks like this:

```json
{
  "id": "1",
  "company_name": "Brightside Co.",
  "job_title": "Frontend Intern",
  "posting_url": "https://www.linkedin.com/jobs/view/4011223344",
  "status": "to_apply",
  "added_at": "2026-09-20T09:15:00.000Z"
}
```

To save one (with a pass copied from the signed-in website):

```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your sign-in pass>" \
  -d '{"company_name":"Brightside Co.","job_title":"Frontend Intern","posting_url":"https://www.linkedin.com/jobs/view/4011223344"}'
```

**The rules**, checked by the API and again by the database:
- `company_name` is required, 120 characters at most
- `job_title` is optional, 160 characters at most
- `posting_url` is required, must start with `http://` or `https://`, 2000
  characters at most
- `status` is `to_apply` (the default) or `done`

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
├── client/                    the website
│   ├── index.html             page title, fonts
│   ├── vercel.json            lets Vercel open /stash directly
│   ├── public/                served as-is: tab icon, home-screen icons, site.webmanifest,
│   │                          and og-image.png (the picture in shared-link previews)
│   └── src/
│       ├── main.jsx           starts the app and the router
│       ├── App.jsx            which page shows at which address
│       ├── styles.css         Tailwind and the design colours, font and sizes
│       ├── pages/             one file per screen
│       │   ├── HomePage.jsx       landing page  (/)
│       │   ├── PrivacyPage.jsx    privacy notice (/privacy)
│       │   └── StashPage.jsx      My Stash      (/stash)
│       ├── components/        pieces used by the pages
│       │   ├── AppHeader.jsx      logo, + Add Job and Sign out, on the app screens
│       │   ├── AddJobDialog.jsx   the Add Job pop-up (/stash/add)
│       │   ├── FilterTabs.jsx     To Apply / Done / All
│       │   ├── StashToolbar.jsx   search and sort
│       │   ├── JobCard.jsx        one saved job
│       │   ├── CardMenu.jsx       the ⋮ menu on a card (mark done, delete)
│       │   ├── UndoToast.jsx      the "Deleted … · Undo" message
│       │   ├── StatusBadge.jsx    the To Apply / Done pill
│       │   ├── Logo.jsx           the JobStash wordmark
│       │   └── DemoNotice.jsx     the demo-mode notice
│       ├── lib/
│       │   ├── auth.jsx           who is signed in, sign out, locks My Stash
│       │   ├── supabase.js        the Supabase sign-in connection (none in demo mode)
│       │   └── format.js          "LinkedIn", "2 days ago"
│       ├── api/               the only code that fetches data
│       │   ├── index.js           picks demo or real
│       │   ├── mockApi.js         demo: browser storage
│       │   ├── httpApi.js         real: calls the API
│       │   └── seed.json          the demo's sample jobs
│       └── assets/            images
├── server/                    the API
│   ├── server.js              the routes and their checks
│   ├── auth.js                checks the sign-in pass on every /api request
│   ├── limits.js              rate limits (too many requests get a 429)
│   ├── logging.js             one log line per request, with nothing private in it
│   ├── jobsRepo.js            the database queries (always for one user)
│   └── db/
│       ├── migrations/        numbered database changes
│       ├── migrate.js         runs the migrations that haven't run yet
│       ├── schema.sql         a picture of the finished table (for reading)
│       ├── seed.sql           sample jobs (deletes existing ones first)
│       ├── pool.js            the database connection
│       └── run.js             runs a .sql file
├── docs/                      planning documents, weekly reports, screenshots,
│                              and the logo (docs/assets/logo: SVG + PNG sizes)
└── AI-USAGE.md                how AI was used in this project
```

## 6. Known issues and next steps

**Known issues**
- **Only Google accounts can sign in.** Email sign-in links need an email
  sender with its own domain, which the project doesn't have yet.
- **The Google app is in Testing mode**, so only the test users listed in
  Google Cloud can sign in until it's published.
- **Only the demo is online.** The GitHub Pages link runs in demo mode, so it
  has no server or database behind it. The full version isn't deployed yet.
- **`npm run db:seed` wipes the table** (it refuses in production). See [Set up the database](#set-up-the-database).

**Next steps**
1. Deploy: the website on Vercel, the API on a free Node host, the database
   already on Supabase. Then switch off the GitHub Pages demo

## Deploying

Only the demo is online, on GitHub Pages. The plan for the full version:

| Piece | Where | Notes |
|---|---|---|
| Website | Vercel | Set `VITE_USE_MOCK_API=false`, `VITE_API_BASE_URL` and the two `VITE_SUPABASE_` settings in Vercel's settings, then redeploy. `client/vercel.json` sends every address to the app, so refreshing `/stash` doesn't give a 404 |
| API | a free Node host (Render or Railway) | Point it at `server/`, add the `server/.env` settings in its dashboard plus `TRUST_PROXY=3`, and add the website's address to `CORS_ORIGINS` |
| Database | Supabase | Already set up |
| Sign-in | Google Cloud and Supabase | Add the website's new address to the Google OAuth client's JavaScript origins and to Supabase's Site URL and redirect URLs, then **Publish app** in Google so anyone can sign in |

**The demo on GitHub Pages** comes from the course template's workflow,
`.github/workflows/deploy-pages.yml`. Every push to `main` that changes
`client/` rebuilds the website in demo mode and republishes it. It stays until
the Vercel version is live, then the workflow is deleted and Pages switched off.

**Database security.** Supabase adds its own public web API to every table.
`schema.sql` turns on Row Level Security for `saved_jobs` with no rules, which
blocks that API completely. The Express server still works, because it
connects as the `postgres` user, which bypasses Row Level Security. Instead,
the server itself keeps lists private: every job has a `user_id`, and every
query only reads or changes the signed-in person's jobs. Asking for someone
else's job gets a `404`, as if it didn't exist.

## Author

_Laurenzo Centeno_ — @EnzoProg-ctrl (https://github.com/EnzoProg-ctrl)
_APSI - CS401_

## Licence

MIT, see [LICENSE](LICENSE).
