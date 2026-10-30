import { Link } from 'react-router'
import { avatarColour, siteName, timeAgo } from '../lib/format.js'
import { useJobs } from '../lib/useJobs.js'
import { usePageTitle } from '../lib/usePageTitle.js'

// Overview: how the job hunt is going, at a glance.
//
//   [ Saved ] [ To Apply ] [ Pending ] [ Accepted ] [ Rejected ]
//   [ Progress (one bar, four parts)   ]  [ Next step      ]
//   [ Where your jobs come from        ]  [ Recently added ]
//
// Phones and tablets: one card under another, the next step first (after the
// numbers), as it's the part to act on. Everything is worked out from the
// same list My Stash shows, so the two always agree.

const WEEK = 7 * 24 * 60 * 60 * 1000
// The sites list shows this many sites by name; the rest are added up as
// "Other sites", so a long list doesn't push everything else down.
const TOP_SITES = 5
// How many jobs "Recently added" shows.
const RECENT = 5

// The four stages, in the colours My Stash uses for them.
const STAGES = [
  { key: 'pending', label: 'Pending', dot: 'bg-pending' },
  { key: 'accepted', label: 'Accepted', dot: 'bg-done' },
  { key: 'rejected', label: 'Rejected', dot: 'bg-error' },
  { key: 'toApply', label: 'To Apply', dot: 'bg-brand-blue/25' },
]

function summarise(jobs, now = Date.now()) {
  const doneJobs = jobs.filter((job) => job.status === 'done')
  const done = doneJobs.length
  const counts = {
    toApply: jobs.length - done,
    pending: doneJobs.filter((job) => job.outcome !== 'accepted' && job.outcome !== 'rejected').length,
    accepted: doneJobs.filter((job) => job.outcome === 'accepted').length,
    rejected: doneJobs.filter((job) => job.outcome === 'rejected').length,
  }
  const thisWeek = jobs.filter((job) => now - new Date(job.added_at).getTime() < WEEK).length

  const perSite = new Map()
  for (const job of jobs) {
    // A job without a link counts under where it was found, or "No link".
    const name = job.posting_url ? siteName(job.posting_url) || 'Unknown site' : job.source || 'No link'
    perSite.set(name, (perSite.get(name) ?? 0) + 1)
  }
  // Most jobs first; sites with the same number in A–Z order.
  const sites = [...perSite].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  const shown = sites.slice(0, TOP_SITES)
  const others = sites.slice(TOP_SITES).reduce((sum, [, count]) => sum + count, 0)
  if (others > 0) shown.push(['Other sites', others])

  const newestFirst = [...jobs].sort((a, b) => b.added_at.localeCompare(a.added_at))
  // The job that has waited longest to be applied to: the next one to do.
  const waiting = newestFirst.filter((job) => job.status !== 'done')
  const next = waiting.at(-1) ?? null

  return {
    saved: jobs.length,
    done,
    counts,
    thisWeek,
    sites: shown,
    recent: newestFirst.slice(0, RECENT),
    next,
    alsoWaiting: Math.max(0, waiting.length - 1),
  }
}

export default function OverviewPage() {
  usePageTitle('Overview')
  const { status, jobs, error, slow, retry } = useJobs()

  return (
    <section>
      <p className="text-xs font-semibold tracking-[0.18em] text-muted uppercase">Overview</p>
      <h1 className="mt-2 text-[2rem] leading-[1.1] font-bold tracking-tight text-ink md:text-[2.75rem]">
        How your job hunt <span className="text-brand-blue">is going</span>.
      </h1>
      <p className="mt-3 text-lg text-muted">Your saved jobs, where they stand, and what to do next.</p>

      {/* Loading: grey stand-ins for the five numbers, like My Stash's grey
          rows. After 5 seconds the note about the sleeping server joins them. */}
      {status === 'loading' && (
        <div className="mt-8" role="status">
          <span className="sr-only">Loading your overview…</span>
          {slow && (
            <p className="mb-4 text-muted">
              Still loading. If JobStash hasn't been used for a while, its server takes up to a
              minute to wake up.
            </p>
          )}
          <div className="grid animate-pulse grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-4" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((tile) => (
              <div key={tile} className={`h-28 rounded-card border border-line bg-surface p-5 ${tile === 0 ? 'col-span-2 lg:col-span-1' : ''}`}>
                <span className="block h-3 w-20 rounded bg-subtle" />
                <span className="mt-4 block h-8 w-12 rounded bg-line" />
              </div>
            ))}
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="mt-8 rounded-card border border-line bg-surface p-6" role="alert">
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
        <div className="mt-8 rounded-card border border-line bg-surface p-8 text-center">
          <p className="font-bold">Nothing stashed yet.</p>
          <p className="mt-1 text-muted">Save your first job, and your progress shows up here.</p>
          <Link
            to="/stash/add"
            className="press mt-4 inline-flex min-h-11 items-center rounded-lg bg-brand-blue px-5 font-semibold text-white hover:bg-brand-blue-dark"
          >
            Add a job
          </Link>
        </div>
      )}

      {status === 'ready' && jobs.length > 0 && <Summary {...summarise(jobs)} />}
    </section>
  )
}

function Summary({ saved, done, counts, thisWeek, sites, recent, next, alsoWaiting }) {
  return (
    <>
      {/* The five numbers. Phones and tablets: Saved across the top, then two
          by two. Laptops: one row. */}
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-4">
        <Stat
          label="Saved"
          value={saved}
          dot="bg-ink"
          note={thisWeek > 0 ? `+${thisWeek} this week` : 'None added this week'}
          className="col-span-2 lg:col-span-1"
        />
        <Stat label="To Apply" value={counts.toApply} dot="bg-brand-blue" />
        <Stat label="Pending" value={counts.pending} dot="bg-pending" />
        <Stat label="Accepted" value={counts.accepted} dot="bg-done" />
        <Stat label="Rejected" value={counts.rejected} dot="bg-error" />
      </div>

      {/* Below 1024px the two column boxes step aside (contents) and order-*
          puts the cards in phone order: next step, progress, recent, sites. */}
      <div className="mt-4 flex flex-col gap-4 lg:mt-6 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-6">
        {/* Left on laptops: Progress, then the sites. */}
        <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-6">
          <Progress saved={saved} done={done} counts={counts} className="max-lg:order-2" />
          <Sites sites={sites} className="max-lg:order-4" />
        </div>
        {/* Right on laptops: what to do next, and the newest jobs. */}
        <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-6">
          <NextStep next={next} alsoWaiting={alsoWaiting} pending={counts.pending} className="max-lg:order-1" />
          <Recent jobs={recent} className="max-lg:order-3" />
        </div>
      </div>
    </>
  )
}

function Card({ title, aside, children, className = '' }) {
  return (
    <div className={`rounded-card border border-line bg-surface p-5 md:p-6 ${className}`}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-bold text-ink">{title}</h2>
        {aside}
      </div>
      {children}
    </div>
  )
}

function Stat({ label, value, dot, note, className = '' }) {
  return (
    <div className={`rounded-card border border-line bg-surface p-4 md:p-5 ${className}`}>
      <p className="flex items-center gap-2 text-sm font-medium text-muted">
        <span className={`size-2 rounded-full ${dot}`} aria-hidden="true" />
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-ink tabular-nums md:text-4xl">{value}</p>
      {note && <p className="mt-1 text-sm text-muted">{note}</p>}
    </div>
  )
}

// One bar in four parts: Pending, Accepted and Rejected (applied), then To
// Apply (not yet). Each part's length is its share of all saved jobs.
function Progress({ saved, done, counts, className }) {
  const percent = Math.round((done / saved) * 100)

  return (
    <Card
      title="Progress"
      className={className}
      aside={
        <p className="text-sm text-muted">
          <span className="font-semibold text-ink">{done} of {saved}</span> applied · {percent}%
        </p>
      }
    >
      <div
        className="mt-4 flex h-3 gap-0.5 overflow-hidden rounded-full bg-subtle"
        role="progressbar"
        aria-label="Jobs applied to"
        aria-valuemin={0}
        aria-valuemax={saved}
        aria-valuenow={done}
        aria-valuetext={`${done} of ${saved} applied (${percent}%): ${counts.pending} pending, ${counts.accepted} accepted, ${counts.rejected} rejected`}
      >
        {STAGES.filter((stage) => counts[stage.key] > 0).map((stage) => (
          <div key={stage.key} className={`h-full ${stage.dot}`} style={{ width: `${(counts[stage.key] / saved) * 100}%` }} />
        ))}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
        {STAGES.map((stage) => (
          <li key={stage.key} className="flex items-center gap-2 text-muted">
            <span className={`size-2 shrink-0 rounded-full ${stage.dot}`} aria-hidden="true" />
            {stage.label}
            <span className="ml-auto font-semibold text-ink tabular-nums sm:ml-0">{counts[stage.key]}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

// What to do next: apply to the job that has waited longest. When nothing is
// left to apply for, the answers still to come, or a nudge to save more.
function NextStep({ next, alsoWaiting, pending, className = '' }) {
  return (
    <div className={`rounded-card border border-brand-blue/20 bg-todo-bg/60 p-5 md:p-6 ${className}`}>
      <h2 className="text-xs font-semibold tracking-[0.14em] text-brand-blue uppercase">Next step</h2>
      {next ? (
        <>
          <p className="mt-3 text-lg leading-snug font-bold text-ink wrap-anywhere">
            Apply to {next.job_title ? `${next.job_title} at ${next.company_name}` : next.company_name}
          </p>
          <p className="mt-1 text-sm text-muted">
            Saved {timeAgo(next.added_at)}, the longest wait in your stash
            {alsoWaiting > 0 && <>, with {alsoWaiting} more after it</>}.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {next.posting_url && (
              <a
                href={next.posting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="press inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-brand-blue px-4 text-sm font-semibold text-white hover:bg-brand-blue-dark"
              >
                Open Posting
                <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M9 3h4v4M13 3L7 9M11 9.5V13H3V5h3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            )}
            <GoToStash />
          </div>
        </>
      ) : (
        <>
          <p className="mt-3 text-lg leading-snug font-bold text-ink">
            {pending > 0 ? `You've applied to every job. ${pending} ${pending === 1 ? 'answer is' : 'answers are'} still to come.` : 'All caught up.'}
          </p>
          <p className="mt-1 text-sm text-muted">Found another opening? Save it and apply when you're ready.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/stash/add"
              className="press inline-flex min-h-11 items-center rounded-lg bg-brand-blue px-4 text-sm font-semibold text-white hover:bg-brand-blue-dark"
            >
              Add Job
            </Link>
            <GoToStash />
          </div>
        </>
      )}
    </div>
  )
}

function GoToStash() {
  return (
    <Link
      to="/stash"
      className="press inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink hover:bg-subtle"
    >
      Go to My Stash
      <svg className="size-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 8h10M9 4l4 4-4 4" />
      </svg>
    </Link>
  )
}

// The newest jobs, as small rows like My Stash's.
function Recent({ jobs, className }) {
  return (
    <Card title="Recently added" className={className}>
      <ul className="mt-3 divide-y divide-line">
        {jobs.map((job) => (
          <li key={job.id} className="flex items-center gap-3 py-3 last:pb-0">
            {/* The company name is right beside it, so screen readers skip this. */}
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${avatarColour(job.company_name)}`}
              aria-hidden="true"
            >
              {job.company_name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{job.job_title || job.company_name}</p>
              <p className="truncate text-sm text-muted">
                {job.job_title ? `${job.company_name} · ` : ''}
                <time dateTime={job.added_at}>{timeAgo(job.added_at)}</time>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function Sites({ sites, className }) {
  const biggest = sites[0][1]

  return (
    <Card title="Where your jobs come from" className={className}>
      <ul className="mt-4 flex flex-col gap-3.5">
        {sites.map(([name, count]) => (
          <li key={name}>
            <div className="flex items-baseline justify-between gap-4 text-sm">
              <span className="min-w-0 truncate font-semibold text-ink">{name}</span>
              <span className="shrink-0 text-muted tabular-nums">
                {count} {count === 1 ? 'job' : 'jobs'}
              </span>
            </div>
            {/* Bar length compared with the biggest site, so the top site fills the row. */}
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-subtle" aria-hidden="true">
              <div className="h-full rounded-full bg-brand-blue" style={{ width: `${(count / biggest) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
