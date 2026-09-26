import { useEffect, useState } from 'react'
import { listJobs, setJobStatus } from '../api'
import DemoNotice from '../components/DemoNotice.jsx'
import FilterTabs from '../components/FilterTabs.jsx'
import JobCard from '../components/JobCard.jsx'
import StashToolbar from '../components/StashToolbar.jsx'

// Shown when a tab has nothing in it. Different from the page having no jobs
// at all, which gets its own message below.
const EMPTY_TAB = {
  to_apply: 'Nothing left to apply for. Nice work!',
  done: 'Nothing marked as done yet.',
}

const COMPARE = {
  newest: (a, b) => b.added_at.localeCompare(a.added_at),
  oldest: (a, b) => a.added_at.localeCompare(b.added_at),
  // "base" ignores capitals and accents, so "acme" sits next to "Acme".
  company: (a, b) => a.company_name.localeCompare(b.company_name, undefined, { sensitivity: 'base' }),
}

// Capitals don't matter, and spaces around the search are ignored.
function matchesSearch(job, query) {
  const words = query.trim().toLowerCase()
  if (!words) return true
  return (
    job.company_name.toLowerCase().includes(words) ||
    job.job_title.toLowerCase().includes(words)
  )
}

// My Stash: every saved job, filtered by the tabs and the search, sorted, with
// a menu on each card to mark it done. Delete comes next.
export default function StashPage() {
  const [status, setStatus] = useState('loading')   // loading | ready | error
  const [jobs, setJobs] = useState([])
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('to_apply')        // to_apply | done | all
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('newest')        // newest | oldest | company
  const [actionError, setActionError] = useState(null)

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

  // The card changes straight away, then the change is saved. If saving fails
  // the card goes back to how it was, so the screen never shows something that
  // was not saved.
  async function handleSetStatus(job, next) {
    const replace = (changed) =>
      setJobs((current) => current.map((row) => (row.id === changed.id ? changed : row)))

    setActionError(null)
    replace({ ...job, status: next })
    try {
      replace(await setJobStatus(job.id, next))
    } catch (caught) {
      replace(job)
      setActionError(`Couldn't update "${job.job_title || job.company_name}": ${caught.message}`)
    }
  }

  // All jobs are already loaded, so the tabs, search and sort only rearrange
  // what is here. No extra request.
  //
  // The counts follow the search, so searching "intern" shows how many matches
  // each tab has.
  const matches = jobs.filter((job) => matchesSearch(job, query))
  const counts = {
    to_apply: matches.filter((job) => job.status === 'to_apply').length,
    done: matches.filter((job) => job.status === 'done').length,
    all: matches.length,
  }
  // filter() already makes a new array, so sorting it leaves `jobs` untouched.
  const visible = matches
    .filter((job) => tab === 'all' || job.status === tab)
    .sort(COMPARE[sort])

  return (
    <section>
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-heading font-bold">My Stash</h1>
          <p className="mt-2 text-lg text-muted">Keep track of jobs you want to apply to.</p>
        </div>
        <DemoNotice className="md:max-w-sm" />
      </div>

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
          <div className="mt-8">
            <FilterTabs value={tab} counts={counts} onChange={setTab} />
          </div>

          <div className="mt-6">
            <StashToolbar query={query} onQueryChange={setQuery} sort={sort} onSortChange={setSort} />
          </div>

          {actionError && (
            <p className="mt-4 rounded-card border border-line bg-surface p-4 text-error" role="alert">
              {actionError}
            </p>
          )}

          {visible.length === 0 && query.trim() ? (
            <div className="mt-6 rounded-card border border-line bg-surface p-8 text-center">
              <p className="font-bold">
                No {tab === 'all' ? 'jobs' : 'jobs on this tab'} match "{query.trim()}".
              </p>
              <button
                type="button"
                onClick={() => setQuery('')}
                className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-line bg-surface px-4 font-semibold text-brand-blue hover:bg-subtle"
              >
                Clear search
              </button>
            </div>
          ) : visible.length === 0 ? (
            <p className="mt-6 rounded-card border border-line bg-surface p-8 text-center text-muted">
              {EMPTY_TAB[tab]}
            </p>
          ) : (
            <ul className="mt-6 flex flex-col gap-4">
              {visible.map((job) => (
                <JobCard key={job.id} job={job} onSetStatus={handleSetStatus} />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
