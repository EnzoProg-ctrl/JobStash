# Deploying JobStash

How the live version is set up, and what to change when something moves.
Back to the [main README](../README.md).

The full version is live. Every push to `main` updates it: Vercel rebuilds the
website and Render rebuilds the API, each in about a minute.

| Piece | Where | Address |
|---|---|---|
| Website | Vercel, Hobby (free) plan | https://jobstash-ph.vercel.app |
| API | Render, Free plan, Singapore | https://jobstash-api.onrender.com |
| Database and sign-in | Supabase, Free plan | (the project's own address) |
| Google sign-in | Google Cloud project "JobStash" | published; branding review requested |

**Render (the API)**: a Web Service from this repository.

| Setting | Value |
|---|---|
| Language / Root Directory | Node / `server` |
| Build Command / Start Command | `npm ci` / `npm start` |
| Health Check Path | `/healthz` |
| Environment | `DATABASE_URL`, `SUPABASE_URL`, `CORS_ORIGINS=http://localhost:5173,https://jobstash-ph.vercel.app`, `NODE_ENV=production`, `TRUST_PROXY=3` |

**Vercel (the website)**: a project from this repository, Root Directory
`client`, preset Vite, address `jobstash-ph.vercel.app` (Settings > Domains).
Environment: `VITE_USE_MOCK_API=false`,
`VITE_API_BASE_URL=https://jobstash-api.onrender.com`, `VITE_SUPABASE_URL`,
`VITE_SUPABASE_PUBLISHABLE_KEY` and `VITE_GOOGLE_CLIENT_ID` (the OAuth client
ID, for Google's own sign-in button; after changing it, redeploy). `client/vercel.json` sends every address to the
app, so opening or refreshing `/stash` works.

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

**Changing the database**: add a numbered migration and run
`npm run db:migrate` from your computer (with `server/.env` pointing at
Supabase) **before** pushing code that needs it. Migrations only add to the
database, so the version still running keeps working.

**Moving to a new address** (for example your own domain): add it in Vercel,
then update `CORS_ORIGINS` on Render, the Supabase Site URL and redirect URLs,
the Google JavaScript origins, the `og:url` and `og:image` lines in
`client/index.html`, and Google Search Console.

**Database security.** Supabase adds its own public web API to every table.
`schema.sql` turns on Row Level Security for `saved_jobs` with no rules, which
blocks that API completely. The Express server still works, because it
connects as the `postgres` user, which bypasses Row Level Security. Instead,
the server itself keeps lists private: every job has a `user_id`, and every
query only reads or changes the signed-in person's jobs. Asking for someone
else's job gets a `404`, as if it didn't exist.
