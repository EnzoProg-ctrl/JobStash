// The real client. Every function here talks to YOUR Express API.
//
// This is the file that matters for your finals project. mockApi.js exists so
// you can build the interface before this has anywhere to point.

const BASE = import.meta.env.VITE_API_BASE_URL || ''

async function request(path, options) {
  const response = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
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
    throw new Error(message)
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
