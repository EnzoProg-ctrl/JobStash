import { useEffect, useState } from 'react'
import { listJobs } from '../api'
import JobCard from '../components/JobCard.jsx'

// My Stash. For now it lists every saved job. The filter tabs, search and the
// card actions come next.
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

      {/* Four states, and each looks different. An empty list means "nothing
          here yet"; an error means "we could not find out". */}
      {status === 'loading' && <p className="mt-6 text-muted">Loading...</p>}

      {status === 'error' && (
        <p className="mt-6 text-error" role="alert">{error.message}</p>
      )}

      {status === 'ready' && jobs.length === 0 && (
        <div className="mt-6 rounded-card border border-line bg-surface p-8 text-center">
          <p className="font-bold">Nothing stashed yet.</p>
          <p className="mt-1 text-muted">Found an interesting job? Save it here and apply later.</p>
        </div>
      )}

      {status === 'ready' && jobs.length > 0 && (
        <ul className="mt-6 flex flex-col gap-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </ul>
      )}
    </section>
  )
}
