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

async function request(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(await signInHeader()),
      ...options.headers,
    },
  })

  if (!response.ok) {
    // Try to use the API's own message; fall back to the status line.
    let message = `${response.status} ${response.statusText}`
    try {
      const body = await response.json()
      if (body?.error) message = body.error
    } catch {
      // The body was not JSON. The status line is all we have.
    }
    // 401: the API no longer accepts this sign-in (it expired, or the account
    // was deleted). Forget it on this device. RequireSignIn then notices
    // nobody is signed in and moves the visitor to the landing page, which
    // reads the note and says why.
    if (response.status === 401 && supabase) {
      leaveSignInNote('expired')
      await supabase.auth.signOut({ scope: 'local' })
    }

    // Keep the status too, so the pages can tell "please sign in" (401)
    // apart from other problems.
    const error = new Error(message)
    error.status = response.status
    throw error
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

// The Done checkbox. Sends only the new status, not the whole job.
export const setJobStatus = (id, status) =>
  request(`/api/jobs/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })

export const deleteJob = (id) =>
  request(`/api/jobs/${id}`, { method: 'DELETE' })
