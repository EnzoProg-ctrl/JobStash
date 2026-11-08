import { Link } from 'react-router'
import { avatarColour, siteName, timeAgo } from '../lib/format.js'
import { useJobs } from '../lib/useJobs.js'
import { usePageTitle } from '../lib/usePageTitle.js'

// Overview: how the job hunt is going, at a glance.
//
//   [ Progress: "7 saved · 3 applied (43%) · +2 this week",
//     one bar in four parts, and their counts ]  [ Next step      ]
//   [ Where your jobs come from               ]  [ Recently added ]
//
// Each number appears once: the counts per stage live under the bar, not
// again in tiles of their own. Phones and tablets: one card under another,
// the next step first, as it's the part to act on. Everything is worked out
// from the same list My Stash shows, so the two always agree.

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
  { key: 'toApply', label: 'To Apply', dot: 'bg-brand-blue/25 dark:bg-brand-blue/50' },
]

// Which of the four stages a job is at.
function stageOf(job) {
  if (job.status !== 'done') return 'toApply'
  return job.outcome === 'accepted' || job.outcome === 'rejected' ? job.outcome : 'pending'
}
const noStages = () => ({ pending: 0, accepted: 0, rejected: 0, toApply: 0 })

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

  // Per site: how many jobs, and how each of them is doing (the same four
  // stages as Progress), so the card can show which sites lead somewhere.
  const perSite = new Map()
  for (const job of jobs) {
    // A job without a link counts under where it was found, or "No link".
    const name = job.posting_url ? siteName(job.posting_url) || 'Unknown site' : job.source || 'No link'
    const site = perSite.get(name) ?? { name, kind: job.posting_url ? 'site' : 'manual', count: 0, ...noStages() }
    site.count += 1
    site[stageOf(job)] += 1
    perSite.set(name, site)
  }
  // Most jobs first; sites with the same number in A–Z order.
  const sites = [...perSite.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  const shown = sites.slice(0, TOP_SITES)
  const rest = sites.slice(TOP_SITES)
  if (rest.length > 0) {
    const others = { name: 'Other sites', kind: 'others', count: 0, ...noStages() }
    for (const site of rest) {
      others.count += site.count
      for (const stage of STAGES) others[stage.key] += site[stage.key]
    }
    shown.push(others)
  }

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
    sourceCount: sites.length,
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
      <h1 className="text-[2rem] leading-[1.1] font-bold tracking-tight text-ink md:text-[2.75rem]">
        How your job hunt <span className="text-brand-blue">is going</span>.
      </h1>
      <p className="mt-3 text-lg text-muted">Your saved jobs, where they stand, and what to do next.</p>

      {/* Loading: grey stand-ins for the top two cards (Progress and Next
          step), like My Stash's grey rows. After 5 seconds a note that it's
          taking longer than usual joins them. */}
      {status === 'loading' && (
        <div className="mt-8" role="status">
          <span className="sr-only">Loading your overview…</span>
          {slow && (
            <p className="mb-4 text-muted">
              Still loading. This is taking longer than usual; a slow connection can do this.
            </p>
          )}
          <div className="grid animate-pulse gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-6" aria-hidden="true">
            <div className="h-40 rounded-card border border-line bg-surface p-6">
              <span className="block h-3 w-24 rounded bg-subtle" />
              <span className="mt-4 block h-5 w-64 max-w-full rounded bg-line" />
              <span className="mt-5 block h-3 rounded-full bg-subtle" />
            </div>
            <div className="h-40 rounded-card border border-line bg-surface p-6 max-lg:hidden">
              <span className="block h-3 w-20 rounded bg-subtle" />
              <span className="mt-4 block h-5 w-40 rounded bg-line" />
            </div>
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
            className="press mt-4 inline-flex min-h-11 items-center rounded-lg bg-brand-blue px-5 font-semibold text-on-brand hover:bg-brand-blue-dark"
          >
            Add a job
          </Link>
        </div>
      )}

      {status === 'ready' && jobs.length > 0 && <Summary {...summarise(jobs)} />}
    </section>
  )
}

function Summary({ saved, done, counts, thisWeek, sites, sourceCount, recent, next, alsoWaiting }) {
  return (
    <>
      {/* Below 1024px the two column boxes step aside (contents) and order-*
          puts the cards in phone order: next step, progress, recent, sites. */}
      <div className="mt-8 flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-6">
        {/* Left on laptops: Progress, then the sites. */}
        <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-6">
          <Progress saved={saved} done={done} counts={counts} thisWeek={thisWeek} className="max-lg:order-2" />
          <Sites sites={sites} saved={saved} sourceCount={sourceCount} className="max-lg:order-4" />
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

// The whole picture in one sentence ("7 saved · 3 applied (43%) · +2 this
// week"), then one bar in four parts: Pending, Accepted and Rejected
// (applied), then To Apply (not yet). Each part's length is its share of all
// saved jobs; the count for each is written under the bar.
function Progress({ saved, done, counts, thisWeek, className }) {
  const percent = Math.round((done / saved) * 100)

  return (
    <Card title="Progress" className={className}>
      <p className="mt-2 text-lg text-muted">
        <span className="font-bold text-ink tabular-nums">{saved} saved</span>
        {' · '}
        <span className="font-bold text-ink tabular-nums">{done} applied</span> ({percent}%)
        {' · '}
        {thisWeek > 0 ? `+${thisWeek} this week` : 'none added this week'}
      </p>
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
          <p className="mt-1 text-sm text-ink/70">
            Saved {timeAgo(next.added_at)}, the longest wait in your stash
            {alsoWaiting > 0 && <>, with {alsoWaiting} more after it</>}.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {next.posting_url && (
              <a
                href={next.posting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="press inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-brand-blue px-4 text-sm font-semibold text-on-brand hover:bg-brand-blue-dark"
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
          <p className="mt-1 text-sm text-ink/70">Found another opening? Save it and apply when you're ready.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/stash/add"
              className="press inline-flex min-h-11 items-center rounded-lg bg-brand-blue px-4 text-sm font-semibold text-on-brand hover:bg-brand-blue-dark"
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

// Where the jobs come from, and how each source is going:
//
//   LinkedIn brings the most (3 of 7). Your accepted job came from Kalibrr.
//   [L] LinkedIn                      3 jobs
//       ███▓▓▓▓░░░░░░  (its share of all jobs, in the Progress colours)
//       2 to apply · 1 pending
//
// The bar's length is the site's share of all saved jobs (1 of 7 fills a
// seventh); inside it, the same four colours as the Progress bar, in the same
// order. The line under it says the same in words, which is also what screen
// readers get (the bar itself is hidden from them).
function Sites({ sites, saved, sourceCount, className }) {
  return (
    <Card title="Where your jobs come from" className={className}>
      <p className="mt-1 text-sm text-pretty text-muted">{takeaway(sites, saved, sourceCount)}</p>
      <ul className="mt-5 flex flex-col gap-4">
        {sites.map((site) => (
          <li key={site.name} className="flex items-start gap-3">
            <SiteBadge site={site} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-4 text-sm">
                <span className="min-w-0 truncate font-semibold text-ink" title={site.name}>{site.name}</span>
                <span className="shrink-0 text-muted tabular-nums">
                  {site.count} {site.count === 1 ? 'job' : 'jobs'}
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-subtle" aria-hidden="true">
                <div className="flex h-full gap-0.5" style={{ width: `${(site.count / saved) * 100}%` }}>
                  {STAGES.filter((stage) => site[stage.key] > 0).map((stage) => (
                    <div key={stage.key} className={`h-full ${stage.dot}`} style={{ flexGrow: site[stage.key] }} />
                  ))}
                </div>
              </div>
              <p className="mt-1 text-xs text-muted">
                {STAGES.filter((stage) => site[stage.key] > 0)
                  .map((stage) => `${site[stage.key]} ${stage.label.toLowerCase()}`)
                  .join(' · ')}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}

// A square like the company letters on My Stash: the site's first letter in
// its own colour; a pencil for jobs saved without a link (typed in: a
// referral, a cold email); a plus for "Other sites".
function SiteBadge({ site }) {
  const base = 'flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold'
  if (site.kind === 'site') {
    return (
      <span className={`${base} ${avatarColour(site.name)}`} aria-hidden="true">
        {site.name.charAt(0).toUpperCase()}
      </span>
    )
  }
  return (
    <span className={`${base} bg-subtle text-muted`} aria-hidden="true">
      <svg className="size-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {site.kind === 'others' ? <path d="M8 3.5v9M3.5 8h9" /> : <path d="M10.5 2.5l3 3-7.5 7.5H3v-3z M9 4l3 3" />}
      </svg>
    </span>
  )
}

// One sentence on top: where most jobs come from, and where the accepted
// ones came from (if any). "Other sites" isn't a site, so it's left out.
function takeaway(sites, saved, sourceCount) {
  const named = sites.filter((site) => site.kind !== 'others')
  const most = named[0].count
  const leaders = named.filter((site) => site.count === most).map((site) => site.name)
  let sentence
  if (named.length === 1 && named[0].count === saved) {
    sentence = `All your jobs come from ${leaders[0]}.`
  } else if (leaders.length === 1) {
    sentence = `${leaders[0]} brings the most (${most} of ${saved}).`
  } else if (leaders.length === 2) {
    sentence = `${leaders[0]} and ${leaders[1]} bring the most (${most} each).`
  } else {
    sentence = `Your jobs are spread across ${sourceCount} places.`
  }

  const accepted = sites.reduce((sum, site) => sum + site.accepted, 0)
  const from = named.filter((site) => site.accepted > 0).map((site) => site.name)
  if (accepted > 0 && from.length > 0) {
    const where = from.length === 1 ? from[0] : `${from.slice(0, -1).join(', ')} and ${from.at(-1)}`
    sentence += accepted === 1 ? ` Your accepted job came from ${where}.` : ` Your ${accepted} accepted jobs came from ${where}.`
  }
  return sentence
}
