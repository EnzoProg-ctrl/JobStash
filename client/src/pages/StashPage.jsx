import { useEffect, useRef, useState } from 'react'
import { deleteJob, setJobStatus } from '../api'
import DemoNotice from '../components/DemoNotice.jsx'
import FilterTabs from '../components/FilterTabs.jsx'
import JobCard from '../components/JobCard.jsx'
import StashToolbar from '../components/StashToolbar.jsx'
import UndoToast from '../components/UndoToast.jsx'
import { smoothly } from '../lib/motion.js'
import { usePageTitle } from '../lib/usePageTitle.js'
import { useJobs } from '../lib/useJobs.js'
import { Outlet } from 'react-router'

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
// a menu on each card to mark it done or delete it.
export default function StashPage() {
  usePageTitle('My Stash')
  // Loading the list, the "waking up" note and Try again live in lib/useJobs.js,
  // shared with the Overview page.
  const { status, jobs, setJobs, error, slow, retry } = useJobs()
  const [tab, setTab] = useState('to_apply')        // to_apply | done | all
  const [query, setQuery] = useState('')
  // What the list is filtered by. It follows query, but through smoothly(), so
  // the cards can slide; the search box itself always updates straight away.
  const [shownQuery, setShownQuery] = useState('')
  const [sort, setSort] = useState('newest')        // newest | oldest | company
  const [actionError, setActionError] = useState(null)
  // The job just deleted, while its Undo message shows (5 seconds).
  const [deleted, setDeleted] = useState(null)
  // The same job, plus the 5-second timer, kept where the timer can read them.
  const pending = useRef(null)
  const timer = useRef(null)

  // The card changes straight away, then the change is saved. If saving fails
  // the card goes back to how it was, so the screen never shows something that
  // was not saved.
  async function handleSetStatus(job, next) {
    const replace = (changed) =>
      setJobs((current) => current.map((row) => (row.id === changed.id ? changed : row)))

    setActionError(null)
    // Smoothly: on the To Apply tab, a job marked done fades out and the ones
    // below slide up into its place.
    smoothly(() => replace({ ...job, status: next }))
    try {
      replace(await setJobStatus(job.id, next))
    } catch (caught) {
      smoothly(() => replace(job))
      setActionError(`Couldn't update "${job.job_title || job.company_name}": ${caught.message}`)
    }
  }

    // Delete: the card disappears straight away, and the Undo message shows for
  // 5 seconds. Only when the time is up is the job really deleted, so Undo can
  // bring it back exactly as it was.
  function handleDelete(job) {
    // A job still waiting from an earlier Delete is deleted for real now.
    clearTimeout(timer.current)
    if (pending.current) reallyDelete(pending.current)

    setActionError(null)
    smoothly(() => setJobs((current) => current.filter((row) => row.id !== job.id)))
    pending.current = job
    setDeleted(job)
    timer.current = setTimeout(() => {
      reallyDelete(job)
      pending.current = null
      setDeleted(null)
    }, 5000)
  }

  // Undo: stop the timer and put the job back. The list is sorted, so it lands
  // in its old place by itself.
  function handleUndo() {
    clearTimeout(timer.current)
    const job = pending.current
    pending.current = null
    setDeleted(null)
    smoothly(() => setJobs((current) => [job, ...current]))
  }

  // The real delete, on the server. If it fails, the job comes back with a
  // message, so nothing disappears that wasn't really deleted.
  async function reallyDelete(job) {
    try {
      await deleteJob(job.id)
    } catch (caught) {
      smoothly(() => setJobs((current) => [job, ...current]))
      setActionError(`Couldn't delete "${job.job_title || job.company_name}": ${caught.message}`)
    }
  }

  // Leaving My Stash within the 5 seconds: the waiting job is deleted on the
  // way out, instead of being forgotten when the timer disappears with the page.
  useEffect(() => {
    return () => {
      clearTimeout(timer.current)
      if (pending.current) deleteJob(pending.current.id).catch(() => {})
    }
  }, [])

  // Called by the Add Job pop-up after it saves. The new job goes first because
  // it is the newest, and the tab and search are reset so it is always visible.
  function handleJobSaved(job) {
    smoothly(() => {
      setJobs((current) => [job, ...current])
      setTab('to_apply')
      setQuery('')
      setShownQuery('')
    })
  }

  // Changing the search or the sort only rearranges the cards, so the cards
  // slide into their new places instead of the list jumping. Changing the tab
  // swaps almost every card at once: the old ones fading out over the new ones
  // looked like flicker, so tabs switch straight away, like in most apps.
  const showTab = (value) => setTab(value)
  const search = (value) => {
    setQuery(value)
    smoothly(() => setShownQuery(value))
  }
  const sortBy = (value) => smoothly(() => setSort(value))

  // All jobs are already loaded, so the tabs, search and sort only rearrange
  // what is here. No extra request.
  //
  // The counts follow the search, so searching "intern" shows how many matches
  // each tab has.
  const matches = jobs.filter((job) => matchesSearch(job, shownQuery))
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
      {status === 'loading' && (
        <div className="mt-6 text-muted" role="status">
          <p>Loading...</p>
          {slow && (
            <p className="mt-2">
              Still loading. If JobStash hasn't been used for a while, its server takes up to a
              minute to wake up.
            </p>
          )}
        </div>
      )}

      {status === 'error' && (
        <div className="mt-6 rounded-card border border-line bg-surface p-6" role="alert">
          <p className="text-error">{error.message}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-line px-4 font-semibold text-ink hover:bg-subtle"
          >
            Try again
          </button>
        </div>
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
            <FilterTabs value={tab} counts={counts} onChange={showTab} />
          </div>

          <div className="mt-6">
            <StashToolbar query={query} onQueryChange={search} sort={sort} onSortChange={sortBy} />
          </div>

          {actionError && (
            <p className="mt-4 rounded-card border border-line bg-surface p-4 text-error" role="alert">
              {actionError}
            </p>
          )}

          {visible.length === 0 && shownQuery.trim() ? (
            <div className="mt-6 rounded-card border border-line bg-surface p-8 text-center">
              <p className="font-bold">
                No {tab === 'all' ? 'jobs' : 'jobs on this tab'} match "{shownQuery.trim()}".
              </p>
              <button
                type="button"
                onClick={() => search('')}
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
                <JobCard key={job.id} job={job} onSetStatus={handleSetStatus} onDelete={handleDelete} />
              ))}
            </ul>
          )}
        </>
      )}
          {deleted && (
        <UndoToast
          message={`Deleted "${deleted.job_title || deleted.company_name}"`}
          onUndo={handleUndo}
        />
      )}
      <Outlet context={{ onJobSaved: handleJobSaved }} />
    </section>
  )
}
