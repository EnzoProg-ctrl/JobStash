# JobStash

A digital clipboard for job hunting: save a job posting link on your phone the moment you find it, then open the same list on your laptop and actually apply.

**Live site:** not deployed yet (planned: Vercel)
**API:** not deployed yet
**Demo video:** not recorded yet

> **This deployment is running in demo mode.** The interface is real; the backend
> is simulated in your browser so the site works without a server. See
> [Demo mode](#demo-mode) below. Delete this quote once the API is live.

<!-- ![A screenshot of My Stash](docs/assets/screenshot.png) -->

## What it does

- Save a job posting: paste the link, add the company and job title
- See everything you saved, newest first, filtered by **To Apply** or **Done**
- Open a posting in a new tab when you are ready to apply
- Mark a job **Done**, or delete one you are no longer interested in

Built for students who browse job openings on a phone between classes but submit
applications later on a laptop, where the CV file is.

## Built with

React and Vite on the front end, Express and PostgreSQL on the back end. Nothing
is deployed yet: the client is planned for Vercel, the API for a free Node host,
and the database for Supabase.

## Demo mode

This repository can run two ways, chosen by one environment variable at **build**
time.

**Demo mode is the default.** Only the exact string `false` turns it off, so a
forgotten or mistyped variable leaves you on the simulated backend with a visible
notice rather than on a silently broken build.

| `VITE_USE_MOCK_API` | What happens |
| --- | --- |
| unset, or `true` | The client answers its own requests from `localStorage`. No server, no database, nothing shared between visitors or devices. |
| `false` | The client calls the Express API at `VITE_API_BASE_URL`, which reads and writes real PostgreSQL. |

Demo mode is a starting point and a fallback, not the finished project. It exists
so the interface can be built before the API is deployed, and so there is
something to show if a free tier is asleep during the demo.

GitHub Pages serves files and cannot run Node, so the API and the database live
elsewhere:

| Piece | Plan |
| --- | --- |
| **Client** | Vercel. It serves from the root of a domain, so the build needs no base path |
| **API** | Express on a free Node host (Render or Railway), decision pending. Vercel runs functions, not a long-running server, so the API does not go there |
| **Database** | PostgreSQL on Supabase |

**Demo mode goes off by:** _(set this date and keep it honest)_

## Running it yourself

**The client only, in demo mode.** No database needed.

    cd client
    npm install
    cp .env.example .env        # VITE_USE_MOCK_API stays true
    npm run dev                 # http://localhost:5173

**The whole stack.** Needs a PostgreSQL, either local or hosted.

    # 1. the database
    docker run --name jobstash-pg -e POSTGRES_PASSWORD=devpassword \
      -e POSTGRES_DB=jobstash -p 5432:5432 -d postgres:17

    # 2. the API
    cd server
    npm install
    cp .env.example .env        # check DATABASE_URL
    npm run db:reset            # creates the tables and adds sample rows
    npm run dev                 # http://localhost:3000

    # 3. the client, in another terminal
    cd client
    npm install
    cp .env.example .env
    # set VITE_USE_MOCK_API=false
    npm run dev

Check the API on its own before blaming the client:

    curl http://localhost:3000/healthz     # is the process alive
    curl http://localhost:3000/readyz      # is the database reachable
    curl http://localhost:3000/api/jobs

## Environment variables

None of these are committed. `.env.example` in each folder lists them with
placeholder values.

| Name | Where | What it is |
| --- | --- | --- |
| `DATABASE_URL` | server | PostgreSQL connection string. Contains a password |
| `CORS_ORIGINS` | server | comma-separated origins allowed to call the API |
| `NODE_ENV` | server | `production` on the host |
| `PORT` | server | **set by the host**, do not set it yourself |
| `VITE_USE_MOCK_API` | client, at build time | only `false` turns demo mode off; unset means on |
| `VITE_API_BASE_URL` | client, at build time | the API's public URL, no trailing slash |

Every `VITE_` value is compiled into the built JavaScript and is **public**.
Never put a key, a password or a connection string in one.

## Deploying

**Client, to GitHub Pages.** Wired up in `.github/workflows/deploy-pages.yml`.
Two one-time steps:

1. **Settings > Pages > Build and deployment > Source: GitHub Actions.** Without
   this the workflow goes green and publishes nothing.
2. Nothing else until the API is live. When it is, add `VITE_USE_MOCK_API` =
   `false` and `VITE_API_BASE_URL` under **Settings > Secrets and variables >
   Actions > Variables**, then re-run the workflow.

The repository must be **public** for Pages to serve it on a free account.

**API and database.** Not automated. Point the host at the `server/` folder, set
the environment variables in its dashboard, and run `server/db/schema.sql` once
against the hosted database.

## Project structure

    client/          React front end, built by Vite
      src/api/       ONE interface, two implementations, chosen by a variable
      src/components/
    server/          Express API
      db/            pool, schema.sql, seed.sql, and a runner for them
    compose.yml      only if self-hosting
    docs/            planning documents and weekly reports

## Architecture

The React client is a static build on GitHub Pages. It never talks to the
database directly: every read and write goes through the Express API over REST
(`/api/jobs`), and only the API holds the database credentials. PostgreSQL is
hosted on Supabase, and the API reaches it with a connection string kept in the
host's environment, never in the repository.

## What I would do next

- _(three honest bullets, written at the end of the project)_

## Author

_[your name]_ — [@EnzoProg-ctrl](https://github.com/EnzoProg-ctrl)
_[course and section]_

## Licence

MIT, see [LICENSE](LICENSE).
