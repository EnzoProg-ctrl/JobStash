import CardMenu from './CardMenu.jsx'
import FavoriteButton from './FavoriteButton.jsx'
import StatusBadge from './StatusBadge.jsx'
import { avatarColour, siteName, timeAgo } from '../lib/format.js'

// One saved job: a row in My Stash's continuous list, with a thin line under
// it rather than a card of its own.
//
//   1280px up: [☐] (B) Title / Company   🔗 Source / 3 weeks ago   [status]  Open Posting ↗   ☆ ⋮
//   768px up:  [☐] (B) Title / Company / Source · 3 weeks ago       [status]  Open Posting ↗   ☆ ⋮
//   phones:    [☐] (B) Title / Company / Source · 3 weeks ago                                 ☆ ⋮
//                      [status]                                                    Open Posting ↗
//
// The status and Open Posting column has a fixed width (wider when the status
// shows), so the columns line up from row to row, link or no link.
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
  const when = timeAgo(job.added_at)

  return (
    <li
      // Lets this row slide on its own when the list changes (lib/motion.js).
      data-transition-name={`job-${job.id}`}
      onClick={selecting ? (event) => { if (!event.target.closest('a, button, input, label')) onSelect() } : undefined}
      className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 border-b border-line px-2 py-3.5 transition-colors last:border-b-0 md:gap-x-5 md:px-4 md:py-3 ${
        showStatus
          ? 'md:grid-cols-[auto_minmax(0,1fr)_16rem_auto] xl:grid-cols-[auto_minmax(0,1fr)_10rem_16rem_auto]'
          : 'md:grid-cols-[auto_minmax(0,1fr)_8.5rem_auto] xl:grid-cols-[auto_minmax(0,1fr)_10rem_8.5rem_auto]'
      } ${
        selected ? 'bg-todo-bg/70' : 'hover:bg-surface'
      } ${selecting ? 'cursor-pointer' : ''}`}
    >
      {/* Tick box (Select mode) and the company's letter circle. */}
      <div className="col-start-1 row-start-1 flex items-center gap-3 self-start md:self-center">
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
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${avatarColour(job.company_name)}`}
          aria-hidden="true"
        >
          {job.company_name.charAt(0).toUpperCase()}
        </span>
      </div>

      <div className="col-start-2 row-start-1 min-w-0">
        <h2 className="font-semibold text-ink wrap-anywhere md:text-[1.0625rem]">{heading}</h2>
        {subheading && <p className="text-muted wrap-anywhere">{subheading}</p>}
        {/* Below 1280px: where and when, under the company. */}
        <p className="mt-0.5 text-sm text-muted wrap-anywhere xl:hidden">
          {where && <>{where} · </>}
          <time dateTime={job.added_at}>{when}</time>
        </p>
      </div>

      {/* 1280px up: where and when in a column of their own. */}
      <div className="hidden min-w-0 text-sm text-muted xl:col-start-3 xl:row-start-1 xl:block">
        <p className="flex min-w-0 items-center gap-1.5">
          {job.posting_url && <LinkIcon />}
          <span className="truncate" title={where}>{where || '—'}</span>
        </p>
        <p className="mt-0.5">
          <time dateTime={job.added_at}>{when}</time>
        </p>
      </div>

      {/* Status (where it's shown) and Open Posting. Phones: a second line,
          status on the left and Open Posting on the right. A job without a
          link has no Open Posting. */}
      {(showStatus || job.posting_url) && (
        <div className="col-span-3 col-start-1 row-start-2 flex items-center justify-between gap-3 pl-14 md:col-span-1 md:col-start-3 md:row-start-1 md:pl-0 xl:col-start-4">
          {showStatus ? <StatusBadge status={job.status} outcome={job.outcome} /> : <span />}
          {job.posting_url && (
            <a
              href={job.posting_url}
              target="_blank"
              rel="noopener noreferrer"
              className="press -mr-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold whitespace-nowrap text-brand-blue hover:bg-todo-bg md:mr-0"
            >
              Open Posting
              <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M9 3h4v4M13 3L7 9M11 9.5V13H3V5h3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
        </div>
      )}

      <div className="col-start-3 row-start-1 flex items-center self-start md:col-start-4 md:self-center xl:col-start-5">
        <FavoriteButton on={job.favorite} label={heading} onToggle={() => onToggleFavorite(job)} />
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

function LinkIcon() {
  return (
    <svg className="size-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M7 9a3 3 0 004.2.3l2-2a3 3 0 00-4.2-4.2l-.8.8M9 7a3 3 0 00-4.2-.3l-2 2a3 3 0 004.2 4.2l.8-.8" />
    </svg>
  )
}
