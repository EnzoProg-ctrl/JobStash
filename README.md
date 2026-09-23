# JobStash

A digital clipboard for job hunting. Save a job posting link on your phone the
moment you find it, then open the same list on your laptop and actually apply.

**Live site:** not deployed yet (planned: Vercel)
**API:** not deployed yet
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
6. [Known issues and next steps](#7-known-issues-and-next-steps)

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
| `CORS_ORIGINS` | `http://localhost:5173` | Which websites may call the API. Comma-separated, no trailing slash |
| `NODE_ENV` | `development` | Set to `production` on a host |
| `PORT` | _(don't set it)_ | A host sets it for you. Locally the API uses 3000 |

**`client/.env`**

| Name | Example | What it is |
|---|---|---|
| `VITE_USE_MOCK_API` | `true` | `true` (or not set) = demo mode, no server needed. Only the exact word `false` connects to the API |
| `VITE_API_BASE_URL` | `http://localhost:3000` | Where the API is. Ignored in demo mode. No trailing slash |

Every `VITE_` value ends up inside the website's code, where anyone can read it.
Never put a password or key in one.

### Set up the database

Only needed for the full version. From `server/`:

```bash
npm run db:schema   # creates the saved_jobs table (safe to run again)
npm run db:seed     # adds 6 sample jobs
```

> ⚠️ **`db:seed` deletes every job in the table first**, then adds the samples.
> Run it once on a new database, never on one with real jobs in it. The same
> goes for `npm run db:reset`, which runs both.

## 3. How to run it

### Demo mode (quickest, no database)

```bash
cd client
npm run dev
```

Open **http://localhost:5173**. You should see the landing page, headed
_"Found it on your phone? Stash it. Apply later."_ Type any email and click
**Email me a sign-in link** (nothing is sent), then **try the demo**, to reach
**My Stash** with six sample jobs. You can also go straight to
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
curl http://localhost:3000/api/jobs   # a list of jobs
```

**2. Start the website.** In `client/.env` set `VITE_USE_MOCK_API=false`, then
in a second terminal, from `client/`:

```bash
npm run dev
```

Open **http://localhost:5173/stash**. The demo-mode box is gone, and the jobs
now come from your database.

## 4. Features and usage

### The main flow

1. **Landing page** (`/`) explains what JobStash is. The sign-in form is not
   working yet (see [Known issues](#7-known-issues-and-next-steps)). Submitting
   it shows a link to the demo.
2. **My Stash** (`/stash`) is the app's home. Every saved job is a card with:
   - the job title and company (if there's no title, the company is shown instead)
   - the website it's from (LinkedIn, Indeed and JobStreet by name, other sites
     by address) and how long ago it was saved
   - a **To Apply** or **Done** badge
   - **Open Posting**, which opens the job in a new tab
3. **Tabs** (To Apply, Done, All) filter the list and show how many jobs each
   has. The page opens on To Apply.
4. **The ⋮ menu** on a card marks the job **done**, or moves a done job **back
   to To Apply**. The card updates straight away. If saving fails, it changes
   back and a message explains why.
5. **Add Job** (`/add`) is a placeholder page for now.

### The API

All responses are JSON. Errors come back as `{"error": "what went wrong"}`.

| Method | Path | What it does |
|---|---|---|
| `GET` | `/healthz` | Is the API running? `{"ok":true}` |
| `GET` | `/readyz` | Can it reach the database? `{"ok":true,"db":"up"}`, or `503` if not |
| `GET` | `/api/jobs` | Every job, newest first |
| `GET` | `/api/jobs?status=to_apply` | Only jobs still to apply for (`?status=done` for finished ones) |
| `GET` | `/api/jobs/:id` | One job, or `404` |
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

To save one:

```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
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
│   └── src/
│       ├── main.jsx           starts the app and the router
│       ├── App.jsx            which page shows at which address
│       ├── styles.css         Tailwind and the design colours, font and sizes
│       ├── pages/             one file per screen
│       │   ├── HomePage.jsx       landing page  (/)
│       │   ├── StashPage.jsx      My Stash      (/stash)
│       │   └── AddJobPage.jsx     Add Job       (/add, placeholder)
│       ├── components/        pieces used by the pages
│       │   ├── JobCard.jsx        one saved job
│       │   ├── CardMenu.jsx       the ⋮ menu on a card
│       │   ├── FilterTabs.jsx     To Apply / Done / All
│       │   ├── StatusBadge.jsx    the To Apply / Done pill
│       │   ├── Logo.jsx           the JobStash wordmark
│       │   └── DemoNotice.jsx     the demo-mode box
│       ├── lib/format.js      "LinkedIn", "2 days ago"
│       ├── api/               the only code that fetches data
│       │   ├── index.js           picks demo or real
│       │   ├── mockApi.js         demo: browser storage
│       │   ├── httpApi.js         real: calls the API
│       │   └── seed.json          the demo's sample jobs
│       └── assets/            images
├── server/                    the API
│   ├── server.js              the routes and their checks
│   ├── jobsRepo.js            the database queries
│   └── db/
│       ├── schema.sql         the saved_jobs table
│       ├── seed.sql           sample jobs (deletes existing ones first)
│       ├── pool.js            the database connection
│       └── run.js             runs a .sql file
├── docs/                      planning documents, weekly reports, screenshots
└── AI-USAGE.md                how AI was used in this project
```

## 6. Known issues and next steps

**Known issues**
- **Everyone shares one list.** There are no accounts yet, and the table
  doesn't record who saved a job. Don't save anything private.
- **The sign-in form doesn't sign you in.** It shows a "coming soon" message
  and a link to the demo. The email is not sent or stored.
- **You can't add a job from the website yet.** The Add Job page is a
  placeholder. Jobs can be added through the API (`POST /api/jobs`).
- **Deleting and searching aren't built yet**, even though the API can delete.
- **Marking a job done has only been tested in demo mode**, not yet against the
  real database.
- **Not deployed.** Everything runs locally for now.
- **`npm run db:seed` wipes the table.** See [Set up the database](#set-up-the-database).

**Next steps**
1. Delete a job, with an **Undo** button in case of a wrong tap
2. The Add Job form
3. Search
4. Test every action against the real database
5. Sign-in, and a `user_id` on each job so each person's list is private
6. Deploy: the website on Vercel, the API on a free Node host, the database
   already on Supabase

## Deploying

Nothing is deployed yet. The plan:

| Piece | Where | Notes |
|---|---|---|
| Website | Vercel | Set `VITE_USE_MOCK_API=false` and `VITE_API_BASE_URL` in Vercel's settings, then redeploy. A `vercel.json` rewrite will be needed so refreshing `/stash` doesn't give a 404 |
| API | a free Node host (Render or Railway) | Point it at `server/`, add the `server/.env` settings in its dashboard, and add the website's address to `CORS_ORIGINS` |
| Database | Supabase | Already set up |

The repository also contains a GitHub Pages workflow from the course template
(`.github/workflows/deploy-pages.yml`). It isn't used while the plan is Vercel.

## Author

_[your name]_ — [@EnzoProg-ctrl](https://github.com/EnzoProg-ctrl)
_[course and section]_

## Licence

MIT, see [LICENSE](LICENSE).
