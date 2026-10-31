# Deploying JobStash

How the live version is set up, and what to change when something moves.
Back to the [main README](../README.md).

The full version is live. Every push to `main` updates it: Vercel rebuilds the
website and the API, each in about a minute.

| Piece | Where | Address |
|---|---|---|
| Website | Vercel, Hobby (free) plan | https://jobstash-ph.vercel.app |
| API | Vercel, Hobby (free) plan, Singapore (`sin1`) | https://jobstash-api.vercel.app |
| Database and sign-in | Supabase, Free plan, Singapore | (the project's own address) |
| Google sign-in | Google Cloud project "JobStash" | published; branding review requested |

The website and the API are two Vercel projects made from the same
repository, each with its own folder.

**Vercel, the API (`jobstash-api`)**: Root Directory `server`, preset Express.
Vercel finds `server/server.js` by its name and runs the app from it for each
request (`start.js`, which starts an always-on server, is only for your own
computer). `server/vercel.json` runs it in Singapore, next to the database.

| Setting | Value |
|---|---|
| `DATABASE_URL` | Supabase's **Transaction pooler** address (port `6543`) for the limited `jobstash_app` account, see below. Mark it sensitive |
| `SUPABASE_URL` | the Supabase project's address |
| `CORS_ORIGINS` | `https://jobstash-ph.vercel.app,http://localhost:5173` |
| `NODE_ENV` | `production` |
| `TRUST_PROXY` | `1` (Vercel replaces the visitor-address header itself, so one step is right) |
| `CRON_SECRET` | a long random string, marked sensitive. Vercel sends it with its daily call to `/cron/keep-alive` (the `crons` in `server/vercel.json`), which keeps Supabase's free database from pausing after a week without activity; any other caller gets `401` |

Vercel runs the API as several short-lived copies, so anything shared between
requests lives in the database: the rate-limit counts are in the
`rate_limits` table (migration 008), and the 5-second limit on slow queries is
stored on the `jobstash_app` account (migration 007).

**Vercel, the website (`jobstash`)**: Root Directory `client`, preset Vite,
address `jobstash-ph.vercel.app` (Settings > Domains). Environment:
`VITE_USE_MOCK_API=false`, `VITE_API_BASE_URL=https://jobstash-api.vercel.app`,
`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_CONTACT_EMAIL` (the
Privacy page's contact address) and `VITE_GOOGLE_CLIENT_ID` (the OAuth client
ID, for Google's own sign-in button). `VITE_` values are built into the
website, so after changing one, redeploy. `client/vercel.json` sends every
address to the app, so opening or refreshing `/stash` works, and adds security
headers (no showing the site inside another site's frame, among others).

**Database accounts**: the API's `DATABASE_URL` logs in as `jobstash_app`
(migration 005), which can only read and write `saved_jobs` and
`rate_limits`. Its address is the Transaction pooler one with
`jobstash_app.<project-ref>` as the user and its own password, set by hand
(`ALTER ROLE jobstash_app PASSWORD '…'`) and kept only in Vercel. Migrations
need the owner, so `server/.env` on your own computer keeps the `postgres`
address (Session pooler, port `5432`) and `npm run db:migrate` runs from there.

**Supabase**: Authentication > URL Configuration has the Site URL
`https://jobstash-ph.vercel.app`, and the redirect URLs
`https://jobstash-ph.vercel.app/**` and `http://localhost:5173/**`.

**Google Cloud**: the OAuth client lists `https://jobstash-ph.vercel.app`,
`http://localhost` and `http://localhost:5173` as JavaScript origins (Google's
sign-in button refuses any address not listed), and Supabase's
`…/auth/v1/callback` as the redirect URI. The app is published, and its
Branding page links the home page and `/privacy`. The site's ownership is
proven to Google Search Console by a meta tag in `client/index.html`; leave it
in.

**Backups**: Supabase's free plan keeps none you can restore. Run
`npm run db:backup` from `server/` (weekly, and before any risky database
change); it saves every job and its owner's email to a dated file in a
`backups` folder next to the repository. Those files are private data.
`npm run db:restore` puts missing jobs back from one (a rehearsal unless you
add `--yes`). See the README's "Back up the database".

**Changing the database**: add a numbered migration and run
`npm run db:migrate` from your computer (with `server/.env` pointing at
Supabase) **before** pushing code that needs it. Migrations only add to the
database, so the version still running keeps working.

**Moving to a new address** (for example your own domain): add it in Vercel,
then update `CORS_ORIGINS` on the API project, the Supabase Site URL and
redirect URLs, the Google JavaScript origins, the `og:url` and `og:image` lines
in `client/index.html`, and Google Search Console.

**Database security.** Supabase adds its own public web API to every table.
Row Level Security is on for `saved_jobs` and `rate_limits`, with rules that
let only `jobstash_app` in, which blocks that public API completely. The
Express server keeps lists private itself: every job has a `user_id`, and
every query only reads or changes the signed-in person's jobs. Asking for
someone else's job gets a `404`, as if it didn't exist.
