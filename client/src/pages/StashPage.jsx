import { useEffect, useState } from 'react'
import { listJobs } from '../api'
import FilterTabs from '../components/FilterTabs.jsx'
import JobCard from '../components/JobCard.jsx'

// Shown when a tab has nothing in it. Different from the page having no jobs
// at all, which gets its own message below.
const EMPTY_TAB = {
  to_apply: 'Nothing left to apply for. Nice work!',
  done: 'Nothing marked as done yet.',
}

// My Stash: every saved job, filtered by the tabs. Search and the card actions
// come next.
export default function StashPage() {
  const [status, setStatus] = useState('loading')   // loading | ready | error
  const [jobs, setJobs] = useState([])
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('to_apply')        // to_apply | done | all

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

  // All jobs are already loaded, so switching tabs only filters what is here.
  // No extra request, and the counts come for free.
  const counts = {
    to_apply: jobs.filter((job) => job.status === 'to_apply').length,
    done: jobs.filter((job) => job.status === 'done').length,
    all: jobs.length,
  }
  const visible = tab === 'all' ? jobs : jobs.filter((job) => job.status === tab)

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
        <>
          <div className="mt-6">
            <FilterTabs value={tab} counts={counts} onChange={setTab} />
          </div>

          {visible.length === 0 ? (
            <p className="mt-6 rounded-card border border-line bg-surface p-8 text-center text-muted">
              {EMPTY_TAB[tab]}
            </p>
          ) : (
            <ul className="mt-6 flex flex-col gap-4">
              {visible.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
