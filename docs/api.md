# JobStash API

The Express API in `server/`. Live at https://jobstash-api.onrender.com;
locally at http://localhost:3000 (`npm run dev` in `server/`). Back to the
[main README](../README.md).

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
| `429` | Too many requests: more than 100 a minute from one device, more than 50 new jobs an hour from one account, or more than 60 link previews every 10 minutes from one account. The `RateLimit` header says how many seconds to wait |

| Method | Path | What it does |
|---|---|---|
| `GET` | `/healthz` | Is the API running? `{"ok":true}` (no sign-in needed) |
| `GET` | `/readyz` | Can it reach the database? `{"ok":true,"db":"up"}`, or `503` if not (no sign-in needed) |
| `GET` | `/api/jobs` | Your jobs, newest first |
| `GET` | `/api/jobs?status=to_apply` | Only jobs still to apply for (`?status=done` for finished ones) |
| `GET` | `/api/jobs/:id` | One of your jobs, or `404` |
| `GET` | `/api/preview?url=…` | The company and position for a job link, read from its page: `{"company_name":"…","job_title":"…","found":"page"}`. `found` is `"link"` when they came from the link's own words, or `null` when nothing was found (both empty). `400` if `url` isn't an `http(s)` link. The server only opens public addresses on ports 80/443, follows at most 3 redirects, stops after 6 seconds and reads at most 1.5 MB (`server/linkPreview.js`) |
| `POST` | `/api/jobs` | Save a job. Returns `201` and the new job |
| `PUT` | `/api/jobs/:id` | Replace a job's details |
| `PATCH` | `/api/jobs/:id` | Change only the status and outcome. Body: `{"status":"done"}` (gives `pending`), `{"status":"done","outcome":"accepted"}`, or `{"status":"to_apply"}`. Or, on its own, the star: `{"favorite":true}` / `{"favorite":false}` |
| `DELETE` | `/api/jobs/:id` | Delete a job. Returns `204` |

A job looks like this:

```json
{
  "id": "1",
  "company_name": "Brightside Co.",
  "job_title": "Frontend Intern",
  "posting_url": "https://www.linkedin.com/jobs/view/4011223344",
  "source": null,
  "status": "to_apply",
  "outcome": null,
  "favorite": false,
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
- `posting_url` is optional (a job seen offline or cold-emailed has none; left
  out or empty, it's saved as `null`). When given, it must start with
  `http://` or `https://`, 2000 characters at most
- `source` is optional: where the job was found, e.g. `"Cold email to the
  hiring manager"`, 120 characters at most. Left out or empty: `null`. `PUT`
  replaces it like the other fields
- `status` is `to_apply` (the default) or `done`
- `outcome` says how a done job turned out: `pending` (applied, waiting),
  `accepted` or `rejected`. It must be empty (`null`) while `status` is
  `to_apply`, and a done job always has one: sending `"status":"done"`
  without an outcome gives `pending`
- `favorite` is `true` (starred) or `false` (the default for a new job). When
  changing a whole job with `PUT`, leaving it out keeps the star as it is
