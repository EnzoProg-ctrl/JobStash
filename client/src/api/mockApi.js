// The simulated backend.
//
// Same function names, same return types, and the same shape of failure as
// httpApi.js, so your components cannot tell the difference. Data lives in the
// visitor's own browser and goes no further.
//
// This is demo mode: the website works with no server at all, which is handy
// for trying it out and for building screens without running the API.

import seed from './seed.json'

const KEY = 'jobstash:jobs'

const STATUSES = ['to_apply', 'done']
const OUTCOMES = ['pending', 'accepted', 'rejected']

// A real network is not instant. Keeping this delay is what forces you to build
// a loading state now, while it is cheap, instead of discovering you need one
// the day you switch to the real API.
const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))

// Demo data saved in a browser before outcomes existed has done jobs with no
// outcome. Treat those as pending, the same as the database did when the
// outcome column was added (server migration 003).
function withOutcome(row) {
  if (row.status === 'done') return { ...row, outcome: row.outcome ?? 'pending' }
  return { ...row, outcome: null }
}

function read() {
  const stored = localStorage.getItem(KEY)
  if (stored) {
    try {
      return JSON.parse(stored).map(withOutcome)
    } catch {
      // Corrupted storage. Start again rather than crashing the app.
      localStorage.removeItem(KEY)
    }
  }
  localStorage.setItem(KEY, JSON.stringify(seed))
  return seed
}

function write(rows) {
  localStorage.setItem(KEY, JSON.stringify(rows))
  return rows
}

// The real API answers a bad status with a 400. Fail the same way here, so a
// bug shows up in demo mode instead of the day the real server is switched on.
function checkStatus(status) {
  if (!STATUSES.includes(status)) {
    throw new Error(`status must be one of: ${STATUSES.join(', ')}`)
  }
}

// The same rule as checkOutcome() in server/server.js: a job to apply for has
// no outcome, a done job always has one, and "done" on its own means pending.
function checkOutcome(status, outcome) {
  const given = outcome ?? null
  if (status === 'to_apply') {
    if (given !== null) throw new Error('outcome must be empty while status is to_apply')
    return null
  }
  if (given === null) return 'pending'
  if (!OUTCOMES.includes(given)) throw new Error(`outcome must be one of: ${OUTCOMES.join(', ')}`)
  return given
}

export async function listJobs({ status } = {}) {
  await delay()
  if (status !== undefined) checkStatus(status)
  return read()
    .filter((row) => status === undefined || row.status === status)
    .sort((a, b) => b.added_at.localeCompare(a.added_at))
}

export async function getJob(id) {
  await delay()
  const found = read().find((row) => String(row.id) === String(id))
  if (!found) throw new Error('Not found')
  return found
}

export async function createJob(input) {
  await delay()
  const status = input.status ?? 'to_apply'
  checkStatus(status)
  const outcome = checkOutcome(status, input.outcome)
  const created = {
    job_title: '',
    ...input,
    status,
    outcome,
    id: crypto.randomUUID(),
    added_at: new Date().toISOString(),
  }
  write([...read(), created])
  return created
}

export async function updateJob(id, input) {
  await delay()
  const rows = read()
  const index = rows.findIndex((row) => String(row.id) === String(id))
  if (index === -1) throw new Error('Not found')
  const status = input.status ?? 'to_apply'
  checkStatus(status)
  const outcome = checkOutcome(status, input.outcome)
  rows[index] = { ...rows[index], ...input, status, outcome }
  write(rows)
  return rows[index]
}

// setJobStatus(id, 'done')               -> done, pending
// setJobStatus(id, 'done', 'accepted')   -> done, accepted
// setJobStatus(id, 'to_apply')           -> to apply, no outcome
export async function setJobStatus(id, status, outcome) {
  await delay()
  checkStatus(status)
  const checked = checkOutcome(status, outcome)
  const rows = read()
  const index = rows.findIndex((row) => String(row.id) === String(id))
  if (index === -1) throw new Error('Not found')
  rows[index] = { ...rows[index], status, outcome: checked }
  write(rows)
  return rows[index]
}

export async function deleteJob(id) {
  await delay()
  write(read().filter((row) => String(row.id) !== String(id)))
}
