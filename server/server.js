import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { pool } from './db/pool.js'
import { requireUser } from './auth.js'
import { newJobsPerAccount, perDevice } from './limits.js'
import { logRequests } from './logging.js'
import * as jobs from './jobsRepo.js'

const app = express()

// CORS before the routes. Middleware registered after a route never sees that
// route's requests, which is the m4 lesson showing up in production.
//
// Name your origins. app.use(cors()) with no options sends
// Access-Control-Allow-Origin: *, which lets any site on the internet call this
// API from a visitor's browser, and is incompatible with cookies.
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

// On a host (Render, Railway), every request reaches the API through the
// host's own proxy, so the visitor's real address is in a header the proxy
// adds. TRUST_PROXY=1 tells Express to read it; without that, every visitor
// would look like the same device to the rate limits. It stays off locally,
// where there is no proxy and anyone could fake that header.
app.set('trust proxy', Number(process.env.TRUST_PROXY) || false)

// First, so every request is logged, even ones turned away further down.
app.use(logRequests)
app.use(helmet())
app.use(cors({ origin: allowedOrigins }))
// After CORS, so a "too many requests" answer still reaches the website
// instead of looking like a CORS error.
app.use(perDevice)
app.use(express.json({ limit: '100kb' }))

// app.param runs before every route that has :id in its path.
const WHOLE_NUMBER = /^[1-9][0-9]{0,17}$/

app.param('id', (request, response, next, id) => {
  if (!WHOLE_NUMBER.test(id)) {
    return response.status(404).json({ error: 'Not found' })
  }
  next()
})

// Is the process alive?
app.get('/healthz', (request, response) => {
  response.json({ ok: true })
})

// Is the database reachable? A different question, and the one that tells you
// in two seconds which half of a problem you have.
app.get('/readyz', async (request, response) => {
  try {
    await pool.query('SELECT 1')
    response.json({ ok: true, db: 'up' })
  } catch (error) {
    console.error('readyz failed:', error.message)
    response.status(503).json({ ok: false, db: 'down' })
  }
})

// Everything under /api is someone's data, so every request there must carry a
// valid sign-in pass (see auth.js). /healthz and /readyz above stay open, so a
// host can check the server is up without signing in.
app.use('/api', requireUser)

const STATUSES = ['to_apply', 'done']

// A saved job is only useful if its link actually opens, so the URL is checked
// rather than just measured. mailto: and javascript: parse fine as URLs, which
// is why the protocol is checked too.
function validUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

// Validation lives on the server because the client can be bypassed. The
// browser form is for a fast, friendly message; this is for correctness, and it
// matches the CHECK constraints in db/schema.sql.
function validate(body) {
  const errors = []
  const company_name = typeof body.company_name === 'string' ? body.company_name.trim() : ''
  const job_title = typeof body.job_title === 'string' ? body.job_title.trim() : ''
  const posting_url = typeof body.posting_url === 'string' ? body.posting_url.trim() : ''
  const status = body.status ?? 'to_apply'

  if (!company_name) errors.push('company_name is required')
  if (company_name.length > 120) errors.push('company_name must be 120 characters or fewer')
  if (job_title.length > 160) errors.push('job_title must be 160 characters or fewer')
  if (!posting_url) errors.push('posting_url is required')
  else if (posting_url.length > 2000) errors.push('posting_url must be 2000 characters or fewer')
  else if (!validUrl(posting_url)) errors.push('posting_url must start with http:// or https://')
  if (!STATUSES.includes(status)) errors.push(`status must be one of: ${STATUSES.join(', ')}`)

  return { errors, value: { company_name, job_title, posting_url, status } }
}

// GET /api/jobs            everything, newest first
// GET /api/jobs?status=done  one tab of My Stash
app.get('/api/jobs', async (request, response, next) => {
  const { status } = request.query

  if (status !== undefined && !STATUSES.includes(status)) {
    return response.status(400).json({ error: `status must be one of: ${STATUSES.join(', ')}` })
  }

  try {
    response.json(await jobs.getAll(pool, request.userId, { status }))
  } catch (error) {
    next(error)
  }
})

app.get('/api/jobs/:id', async (request, response, next) => {
  try {
    const row = await jobs.getById(pool, request.userId, request.params.id)
    if (!row) return response.status(404).json({ error: 'Not found' })
    response.json(row)
  } catch (error) {
    next(error)
  }
})

app.post('/api/jobs', newJobsPerAccount, async (request, response, next) => {
  const { errors, value } = validate(request.body ?? {})
  if (errors.length > 0) return response.status(400).json({ error: errors.join('; ') })

  try {
    const row = await jobs.create(pool, request.userId, value)
    if (!row) {
      return response.status(409).json({
        error: `You have ${jobs.MAX_JOBS.toLocaleString('en-US')} saved jobs, the most one account can keep.`,
      })
    }
    response.status(201).json(row)
  } catch (error) {
    next(error)
  }
})

app.put('/api/jobs/:id', async (request, response, next) => {
  const { errors, value } = validate(request.body ?? {})
  if (errors.length > 0) return response.status(400).json({ error: errors.join('; ') })

  try {
    const row = await jobs.update(pool, request.userId, request.params.id, value)
    if (!row) return response.status(404).json({ error: 'Not found' })
    response.json(row)
  } catch (error) {
    next(error)
  }
})

// Ticking "Done" changes one column. PATCH says exactly that, and means the
// client does not have to send a whole job back to toggle a checkbox.
app.patch('/api/jobs/:id', async (request, response, next) => {
  const { status } = request.body ?? {}

  if (!STATUSES.includes(status)) {
    return response.status(400).json({ error: `status must be one of: ${STATUSES.join(', ')}` })
  }

  try {
    const row = await jobs.setStatus(pool, request.userId, request.params.id, status)
    if (!row) return response.status(404).json({ error: 'Not found' })
    response.json(row)
  } catch (error) {
    next(error)
  }
})

app.delete('/api/jobs/:id', async (request, response, next) => {
  try {
    const removed = await jobs.remove(pool, request.userId, request.params.id)
    if (!removed) return response.status(404).json({ error: 'Not found' })
    response.status(204).end()
  } catch (error) {
    next(error)
  }
})

app.use((request, response) => {
  response.status(404).json({ error: 'No such route' })
})

// The detail goes in the logs; the visitor gets a plain message. Sending a
// stack trace to a stranger tells them about the file layout and dependencies.
app.use((error, request, response, next) => {
  // A valid pass for an account that has since been deleted: the database
  // refuses to link a job to a user who no longer exists.
  if (error.code === '23503' && error.constraint === 'saved_jobs_user_id_fkey') {
    return response.status(401).json({ error: 'Your account no longer exists. Please sign in again.' })
  }
  console.error(error)
  response.status(500).json({ error: 'Something went wrong on our side. Please try again.' })
})

// The host chooses the port and tells you through PORT. Hardcoding 3000 is the
// commonest reason a first deploy is marked unhealthy and killed.
const port = process.env.PORT || 3000

const server = app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
  console.log(`CORS allows: ${allowedOrigins.join(', ')}`)
})

// Safe restarts. A host stops the API with SIGTERM on every deploy and
// restart, and Ctrl+C sends SIGINT. Instead of dropping whatever is in
// progress, stop taking new requests, let the open ones finish, close the
// database connections, then exit. If something hangs, give up after 10
// seconds, because the host will force it soon after anyway.
function shutDown(signal) {
  console.log(`${signal} received: finishing open requests, then stopping`)
  server.close(async () => {
    await pool.end()
    console.log('Stopped cleanly')
    process.exit(0)
  })
  setTimeout(() => {
    console.error('Still busy after 10 seconds, stopping anyway')
    process.exit(1)
  }, 10_000).unref()
}

process.once('SIGTERM', () => shutDown('SIGTERM'))
process.once('SIGINT', () => shutDown('SIGINT'))
