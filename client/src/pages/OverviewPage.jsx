import { Link } from 'react-router'
import { siteName } from '../lib/format.js'
import { useJobs } from '../lib/useJobs.js'
import { usePageTitle } from '../lib/usePageTitle.js'

// Overview: how the job hunt is going, at a glance. How many jobs are saved,
// to apply and done, how far along you are, how many were added this week,
// and which job sites they come from. Everything is worked out from the same
// list My Stash shows, so the two always agree.

const WEEK = 7 * 24 * 60 * 60 * 1000
// The sites list shows this many sites by name; the rest are added up as
// "Other sites", so a long list doesn't push everything else down.
const TOP_SITES = 5

function summarise(jobs, now = Date.now()) {
  const done = jobs.filter((job) => job.status === 'done').length
  const thisWeek = jobs.filter((job) => now - new Date(job.added_at).getTime() < WEEK).length

  const perSite = new Map()
  for (const job of jobs) {
    const name = siteName(job.posting_url) || 'Unknown site'
    perSite.set(name, (perSite.get(name) ?? 0) + 1)
  }
  // Most jobs first; sites with the same number in A–Z order.
  const sites = [...perSite].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  const shown = sites.slice(0, TOP_SITES)
  const others = sites.slice(TOP_SITES).reduce((sum, [, count]) => sum + count, 0)
  if (others > 0) shown.push(['Other sites', others])

  return { saved: jobs.length, toApply: jobs.length - done, done, thisWeek, sites: shown }
}

export default function OverviewPage() {
  usePageTitle('Overview')
  const { status, jobs, error, slow, retry } = useJobs()

  return (
    <section>
      <h1 className="text-heading font-bold">Overview</h1>
      <p className="mt-2 text-lg text-muted">How your job hunt is going.</p>

      {/* Loading, slow and error look the same as on My Stash. */}
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
          <p className="mt-1 text-muted">Save your first job, and your progress shows up here.</p>
          <Link
            to="/stash/add"
            className="press mt-4 inline-flex min-h-11 items-center rounded-lg bg-brand-blue px-5 font-semibold text-white hover:bg-todo"
          >
            Add a job
          </Link>
        </div>
      )}

      {status === 'ready' && jobs.length > 0 && <Summary {...summarise(jobs)} />}
    </section>
  )
}

function Summary({ saved, toApply, done, thisWeek, sites }) {
  const percent = Math.round((done / saved) * 100)
  const biggest = sites[0][1]

  return (
    <>
      {/* The three numbers */}
      <div className="mt-8 grid grid-cols-3 gap-2 md:gap-4">
        <Stat label="Saved" value={saved} className="text-ink" />
        <Stat label="To Apply" value={toApply} className="text-todo" />
        <Stat label="Done" value={done} className="text-done" />
      </div>

      {/* Progress */}
      <div className="mt-4 rounded-card border border-line bg-surface p-5 md:p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-bold">Progress</h2>
          <p className="text-sm text-muted">
            <span className="font-semibold text-ink">{done} of {saved}</span> applied
          </p>
        </div>
        <div
          className="mt-3 h-3 overflow-hidden rounded-full bg-subtle"
          role="progressbar"
          aria-label="Jobs applied to"
          aria-valuemin={0}
          aria-valuemax={saved}
          aria-valuenow={done}
          aria-valuetext={`${done} of ${saved} applied (${percent}%)`}
        >
          <div className="h-full rounded-full bg-done" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-3 text-sm text-muted">
          Added this week: <span className="font-semibold text-ink">{thisWeek}</span>
        </p>
      </div>

      {/* Where the jobs come from */}
      <div className="mt-4 rounded-card border border-line bg-surface p-5 md:p-6">
        <h2 className="font-bold">Where your jobs come from</h2>
        <ul className="mt-4 flex flex-col gap-3">
          {sites.map(([name, count]) => (
            <li key={name}>
              <div className="flex items-baseline justify-between gap-4 text-sm">
                <span className="min-w-0 truncate font-semibold text-ink">{name}</span>
                <span className="shrink-0 text-muted">
                  {count} {count === 1 ? 'job' : 'jobs'}
                </span>
              </div>
              {/* Bar length compared with the biggest site, so the top site fills the row. */}
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-subtle" aria-hidden="true">
                <div className="h-full rounded-full bg-brand-blue" style={{ width: `${(count / biggest) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Link
        to="/stash"
        className="press mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-surface px-4 font-semibold text-brand-blue hover:bg-subtle"
      >
        Go to My Stash
        <svg className="size-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 8h10M9 4l4 4-4 4" />
        </svg>
      </Link>
    </>
  )
}

function Stat({ label, value, className }) {
  return (
    <div className="rounded-card border border-line bg-surface p-3 md:p-5">
      <p className={`text-3xl font-bold md:text-4xl ${className}`}>{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  )
}
