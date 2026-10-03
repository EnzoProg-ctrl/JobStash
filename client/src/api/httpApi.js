// The real client. Every function here talks to YOUR Express API.
//
// This is the file that matters for your finals project. mockApi.js exists so
// you can build the interface before this has anywhere to point.

import { supabase } from '../lib/supabase.js'
import { leaveSignInNote } from '../lib/auth.jsx'

const BASE = import.meta.env.VITE_API_BASE_URL || ''

// The API only answers people who are signed in (server/auth.js), so every
// request carries the sign-in pass from Supabase Auth. getSession() hands back
// the current pass, and swaps in a fresh one first if it has run out, so a
// page left open for hours keeps working.
async function signInHeader() {
  if (!supabase) return {}
  const { data } = await supabase.auth.getSession()
  const pass = data.session?.access_token
  return pass ? { Authorization: `Bearer ${pass}` } : {}
}

// A free host puts the API to sleep when nobody has used it for a while, and
// the first request then waits up to a minute while it wakes up. So only give
// up after 90 seconds, long enough for that, but not forever.
const GIVE_UP_AFTER = 90 * 1000

// An Error that also says what went wrong: the HTTP status, or 0 when the API
// never answered at all.
function problem(message, status) {
  const error = new Error(message)
  error.status = status
  return error
}

async function request(path, options = {}) {
  const pass = await signInHeader()
  let response
  try {
    response = await fetch(`${BASE}${path}`, {
      ...options,
      signal: AbortSignal.timeout(GIVE_UP_AFTER),
      headers: {
        'Content-Type': 'application/json',
        ...pass,
        ...options.headers,
      },
    })
  } catch (caught) {
    // The API never answered. The browser's own words for this ("Failed to
    // fetch", "Load failed") mean nothing to a visitor, so say it plainly.
    if (caught.name === 'TimeoutError') {
      throw problem('JobStash is taking too long to answer. Please try again in a moment.', 0)
    }
    if (!navigator.onLine) {
      throw problem("You're offline. Check your internet connection and try again.", 0)
    }
    throw problem("Can't reach JobStash right now. Please try again in a moment.", 0)
  }

  if (!response.ok) {
    // The API's own message is written for people, so use it when there is
    // one: "Too many requests…", "You have 1,000 saved jobs…". Without one, the
    // answer came from the host in front of the API (it is restarting or
    // down), and a status line like "502 Bad Gateway" means nothing to a
    // visitor.
    let message = "JobStash isn't answering properly right now. Please try again in a moment."
    try {
      const body = await response.json()
      if (body?.error) message = body.error
    } catch {
      // The body was not JSON. Keep the plain message above.
    }
    // 401: the API no longer accepts this sign-in (it expired, or the account
    // was deleted). Forget it on this device. RequireSignIn then notices
    // nobody is signed in and moves the visitor to the landing page, which
    // reads the note and says why.
    //
    // Only when a sign-in was actually sent: a request made just after signing
    // out (a delete still waiting for its Undo time, say) has none, and that
    // isn't an expired sign-in, so it mustn't replace "You've signed out".
    if (response.status === 401 && supabase && pass.Authorization) {
      leaveSignInNote('expired')
      await supabase.auth.signOut({ scope: 'local' })
    }

    // Keep the status too, so the pages can tell "please sign in" (401)
    // apart from other problems.
    throw problem(message, response.status)
  }

  return response.status === 204 ? null : response.json()
}

// listJobs()                   every job, newest first
// listJobs({ status: 'done' }) one tab of My Stash
export const listJobs = ({ status } = {}) =>
  request(status ? `/api/jobs?status=${encodeURIComponent(status)}` : '/api/jobs')

export const getJob = (id) => request(`/api/jobs/${id}`)

export const createJob = (input) =>
  request('/api/jobs', { method: 'POST', body: JSON.stringify(input) })

export const updateJob = (id, input) =>
  request(`/api/jobs/${id}`, { method: 'PUT', body: JSON.stringify(input) })

// Marking a job. Sends only the new status and outcome, not the whole job.
// setJobStatus(id, 'done')              -> done, pending
// setJobStatus(id, 'done', 'accepted')   -> done, accepted
// setJobStatus(id, 'to_apply')           -> to apply, no outcome
// (An outcome left out isn't sent, so the API uses its default.)
export const setJobStatus = (id, status, outcome) =>
  request(`/api/jobs/${id}`, { method: 'PATCH', body: JSON.stringify({ status, outcome }) })

export const deleteJob = (id) =>
  request(`/api/jobs/${id}`, { method: 'DELETE' })
