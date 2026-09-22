import { useEffect, useState } from 'react'
import { listJobs } from '../api'

// Placeholder. Becomes the list of saved jobs with the filter tabs. For now it
// only counts them, to show the page reaches the data layer.
export default function StashPage() {
  const [status, setStatus] = useState('loading')   // loading | ready | error
  const [jobs, setJobs] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    listJobs()
      .then((rows) => {
        setJobs(rows)
        setStatus('ready')
      })
      .catch((caught) => {
        setError(caught)
        setStatus('error')
      })
  }, [])

  return (
    <section>
      <h1 className="text-heading font-bold">My Stash</h1>
      <p className="mt-2 text-muted">Jobs you've saved for later.</p>

      {status === 'loading' && <p className="mt-6 text-muted">Loading...</p>}
      {status === 'error' && (
        <p className="mt-6 text-error" role="alert">{error.message}</p>
      )}
      {status === 'ready' && (
        <p className="mt-6">
          {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} saved
        </p>
      )}
    </section>
  )
}
