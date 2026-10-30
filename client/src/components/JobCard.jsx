import CardMenu from './CardMenu.jsx'
import FavoriteButton from './FavoriteButton.jsx'
import StatusBadge from './StatusBadge.jsx'
import { addedOn, avatarColour, siteName, timeAgo } from '../lib/format.js'

// One saved job: a row in My Stash's continuous list, with a thin line under
// it rather than a card of its own.
//
//   1280px up: [☐] (B) Title / Company   🌐 Source / Added Oct 25, 2026   [status]   ☆ ↗ ⋮
//   768px up:  [☐] (B) Title / Company / Source · Oct 25, 2026            [status]   ☆ ↗ ⋮
//   phones:    [☐] (B) Title / Company / Source · Oct 25, 2026                       ☆ ⋮
//                      [status]                                       Open Posting ↗
//
// The columns have fixed widths, so they line up from row to row. A job
// without a link keeps an empty space where ↗ would be, so ☆ and ⋮ line up
// too. Which part goes where is the job-row style in styles.css; each part
// names its area (pic, main, where, status, act).
//
// showStatus: the status chip, left out on To Apply (every job there is To
// Apply). selecting: Select mode, with a tick box at the front; clicking
// anywhere on the row (outside its buttons) ticks it too.
export default function JobCard({ job, showStatus, onSetStatus, onToggleFavorite, selecting, selected, onSelect }) {
  // The title is optional, so a link can be saved before you know what the
  // role is called. Without one, the company moves up to the bold line.
  const heading = job.job_title || job.company_name
  const subheading = job.job_title ? job.company_name : null
  // Where it's from: the job site, and/or where it was found (a job without a
  // link, server migration 006), e.g. "Cold email to the hiring manager".
  const where = [siteName(job.posting_url), job.source].filter(Boolean).join(' · ')
  // "Added Oct 25, 2026" in its own column, just "Oct 25, 2026" in the
  // narrower line under the company. Hovering it shows how long ago that was.
  const when = (word) => (
    <time dateTime={job.added_at} title={timeAgo(job.added_at)}>
      {word}{addedOn(job.added_at)}
    </time>
  )

  return (
    <li
      // Lets this row slide on its own when the list changes (lib/motion.js).
      data-transition-name={`job-${job.id}`}
      onClick={selecting ? (event) => { if (!event.target.closest('a, button, input, label')) onSelect() } : undefined}
      className={`job-row grid items-center gap-x-3 border-b border-line px-2 py-3.5 transition-colors last:border-b-0 md:gap-x-5 md:px-4 md:py-4 ${
        showStatus ? 'with-status' : ''
      } ${
        selected ? 'bg-todo-bg/70' : 'hover:bg-surface'
      } ${selecting ? 'cursor-pointer' : ''}`}
    >
      {/* Tick box (Select mode) and the company's letter square. */}
      <div className="flex items-center gap-3 self-start [grid-area:pic] md:self-center">
        {selecting && (
          <input
            type="checkbox"
            className="size-5 shrink-0 accent-brand-blue"
            checked={selected}
            onChange={onSelect}
            aria-label={`Select ${heading}`}
          />
        )}
        {/* The company name is right beside it, so screen readers skip this. */}
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold md:size-14 md:text-xl ${avatarColour(job.company_name)}`}
          aria-hidden="true"
        >
          {job.company_name.charAt(0).toUpperCase()}
        </span>
      </div>

      <div className="min-w-0 [grid-area:main]">
        <h2 className="font-semibold text-ink wrap-anywhere md:text-[1.1875rem]">{heading}</h2>
        {subheading && <p className="text-muted wrap-anywhere md:mt-0.5">{subheading}</p>}
        {/* Below 1280px: where and when, under the company. */}
        <p className="mt-0.5 text-sm text-muted wrap-anywhere xl:hidden">
          {where && <>{where} · </>}
          {when('')}
        </p>
      </div>

      {/* 1280px up: where and when in a column of their own. */}
      <div className="hidden min-w-0 text-[0.9375rem] text-muted [grid-area:where] xl:block">
        <p className="flex min-w-0 items-center gap-2">
          {job.posting_url && <GlobeIcon />}
          <span className="truncate" title={where}>{where || '—'}</span>
        </p>
        <p className={`mt-1 text-sm ${job.posting_url ? 'pl-6' : ''}`}>{when('Added ')}</p>
      </div>

      {/* Phones: a second line, the status on the left and Open Posting on
          the right. From 768px this box steps aside (contents): the status
          goes to its own column, and ↗ joins ☆ and ⋮. */}
      {(showStatus || job.posting_url) && (
        <div className="mt-2 flex items-center justify-between gap-3 [grid-area:extra] md:contents">
          {showStatus ? (
            <div className="md:[grid-area:status]">
              <StatusBadge status={job.status} outcome={job.outcome} />
            </div>
          ) : (
            <span />
          )}
          {job.posting_url && (
            <a
              href={job.posting_url}
              target="_blank"
              rel="noopener noreferrer"
              className="press -mr-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold whitespace-nowrap text-brand-blue hover:bg-todo-bg md:hidden"
            >
              Open Posting
              <OpenIcon className="size-4" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
        </div>
      )}

      <div className="flex items-center self-start [grid-area:act] md:gap-1 md:self-center">
        <FavoriteButton on={job.favorite} label={heading} onToggle={() => onToggleFavorite(job)} />
        {job.posting_url ? (
          <a
            href={job.posting_url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open posting"
            className="press hidden size-11 items-center justify-center rounded-lg text-muted hover:bg-subtle hover:text-brand-blue md:inline-flex"
          >
            <OpenIcon className="size-5" />
            <span className="sr-only">Open posting for {heading} (opens in a new tab)</span>
          </a>
        ) : (
          <span className="hidden size-11 md:block" aria-hidden="true" />
        )}
        <CardMenu
          label={heading}
          status={job.status}
          outcome={job.outcome}
          onSetStatus={(status, outcome) => onSetStatus(job, status, outcome)}
        />
      </div>
    </li>
  )
}

// A box with an arrow leaving it: opens in a new tab.
function OpenIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M9 3h4v4M13 3L7 9M11 9.5V13H3V5h3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// A job site on the web.
function GlobeIcon() {
  return (
    <svg className="size-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <circle cx="8" cy="8" r="6.25" />
      <path d="M1.75 8h12.5M8 1.75c1.7 1.7 2.5 3.8 2.5 6.25S9.7 12.55 8 14.25M8 1.75C6.3 3.45 5.5 5.55 5.5 8s.8 4.55 2.5 6.25" />
    </svg>
  )
}
