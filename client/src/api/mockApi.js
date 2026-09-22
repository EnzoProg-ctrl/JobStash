// The simulated backend.
//
// Same function names, same return types, and the same shape of failure as
// httpApi.js, so your components cannot tell the difference. Data lives in the
// visitor's own browser and goes no further.
//
// This exists so the GitHub Pages link works on day one and so you can build
// the interface before your API is deployed. It is NOT a finished project. See
// content/extending-your-app page 3.

import seed from './seed.json'

const KEY = 'jobstash:jobs'

const STATUSES = ['to_apply', 'done']

// A real network is not instant. Keeping this delay is what forces you to build
// a loading state now, while it is cheap, instead of discovering you need one
// the day you switch to the real API.
const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))

function read() {
  const stored = localStorage.getItem(KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
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
  const created = {
    job_title: '',
    ...input,
    status,
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
  rows[index] = { ...rows[index], ...input }
  write(rows)
  return rows[index]
}

export async function setJobStatus(id, status) {
  await delay()
  checkStatus(status)
  const rows = read()
  const index = rows.findIndex((row) => String(row.id) === String(id))
  if (index === -1) throw new Error('Not found')
  rows[index] = { ...rows[index], status }
  write(rows)
  return rows[index]
}

export async function deleteJob(id) {
  await delay()
  write(read().filter((row) => String(row.id) !== String(id)))
}
