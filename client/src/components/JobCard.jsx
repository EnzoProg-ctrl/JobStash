import CardMenu from './CardMenu.jsx'
import FavoriteButton from './FavoriteButton.jsx'
import StatusBadge from './StatusBadge.jsx'
import { addedOn, avatarColour, siteName, timeAgo } from '../lib/format.js'
import { useCardClick } from '../lib/useCardClick.js'
import { useSwipeToDelete } from '../lib/useSwipeToDelete.js'

// One saved job: a row in My Stash's continuous list, with a thin line under
// it rather than a card of its own.
//
//   1280px up: [☐] (B) Title / Company   🌐 Source / Added Oct 25, 2026   [status]   ☆ ↗ ⋮
//   768px up:  [☐] (B) Title / Company / Source · Oct 25, 2026            [status]   ☆ ↗ ⋮
//   phones:    [☐] (B) Title / Company / Source · Oct 25, 2026                       ☆ ⋮
//                      [status]
//
// The columns have fixed widths, so they line up from row to row. A job
// without a link keeps an empty space where ↗ would be, so ☆ and ⋮ line up
// too. Which part goes where is the job-row style in styles.css; each part
// names its area (pic, main, where, status, act).
//
// Clicking anywhere on the row (outside its buttons) opens the posting in a
// new tab, or ticks the row in Select mode (lib/useCardClick.js). On phones
// that tap is the way to open it, so there's no Open button there; a link
// only screen readers see (VoiceOver) stands in for it.
//
// Swiping a row to the left with a finger deletes it (onDelete, with My
// Stash's Undo message): the row slides away over a red layer with a bin
// (lib/useSwipeToDelete.js). Not in Select mode, and not without onDelete
// (the landing page's preview).
//
// showStatus: the status chip, left out on To Apply (every job there is To
// Apply). selecting: Select mode, with a tick box at the front.
export default function JobCard({ job, showStatus, onSetStatus, onToggleFavorite, onDelete, selecting, selected, onSelect }) {
  const click = useCardClick({ url: job.posting_url, selecting, onSelect })
  const swipe = useSwipeToDelete({
    enabled: Boolean(onDelete) && !selecting,
    onDelete: () => onDelete(job),
    // A swipe isn't a tap: don't open the posting when the finger lifts.
    onStart: click.cancel,
  })
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
      onPointerDown={click.onPointerDown}
      onClick={click.onClick}
      // overflow-hidden only while swiping: it keeps the red layer inside the
      // row, but would also cut off the ⋮ menu, which hangs below the row.
      className={`relative border-b border-line last:border-b-0 ${swipe.swiping ? 'overflow-hidden' : ''}`}
    >
      {/* Behind the row, uncovered as it slides left: red, with a bin that
          grows in as you swipe. Only there while swiping. */}
      {swipe.swiping && (
        <div aria-hidden="true" className="absolute inset-0 flex items-center justify-end bg-error pr-7 text-white">
          <BinIcon
            className="size-6"
            style={{ opacity: 'var(--swipe-progress, 0)', transform: 'scale(calc(0.6 + 0.4 * var(--swipe-progress, 0)))' }}
          />
        </div>
      )}
      {/* The row itself, which slides. relative: on top of the red layer.
          With onDelete it has the page's own background, so the red doesn't
          show through it. touch-pan-y: the browser keeps up-and-down
          scrolling and leaves sideways moves to the swipe. */}
      <div
        ref={swipe.ref}
        className={`job-row relative grid items-center gap-x-3 px-2 py-3.5 transition-colors md:gap-x-5 md:px-4 md:py-4 ${
          onDelete ? 'touch-pan-y touch-pinch-zoom' : ''
        } ${showStatus ? 'with-status' : ''} ${
          selected ? 'bg-todo-bg/70' : `${onDelete ? 'bg-bg' : ''} hover:bg-surface`
        } ${selecting || job.posting_url ? 'cursor-pointer' : ''}`}
      >
        {/* Tick box (Select mode) and the company's letter square. */}
        <div className="flex items-center gap-3 self-start [grid-area:pic] md:self-center">
          {/* Always there, but 0 wide (and out of reach: inert) until Select
              mode, so it slides in and the letter square eases over. -mr-3
              takes back the gap while it's hidden. */}
          <span
            className={`flex shrink-0 items-center overflow-clip transition-[width,margin-right,opacity] duration-300 ease-out [overflow-clip-margin:6px] ${
              selecting ? 'w-5 opacity-100' : '-mr-3 w-0 opacity-0'
            }`}
            {...(!selecting && { inert: '' })}
          >
            <input
              type="checkbox"
              className="select-box size-5 shrink-0 accent-brand-blue"
              checked={selected}
              onChange={onSelect}
              aria-label={`Select ${heading}`}
            />
          </span>
          {/* The company name is right beside it, so screen readers skip this. */}
          <span
            className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold md:size-14 md:text-xl ${avatarColour(job.company_name)}`}
            aria-hidden="true"
          >
            {job.company_name.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* relative: keeps the hidden link below inside the row. */}
        <div className="relative min-w-0 [grid-area:main]">
          <h2 className="font-semibold text-ink wrap-anywhere md:text-[1.1875rem]">{heading}</h2>
          {subheading && <p className="text-muted wrap-anywhere md:mt-0.5">{subheading}</p>}
          {/* Below 1280px: where and when, under the company. */}
          <p className="mt-0.5 text-sm text-muted wrap-anywhere xl:hidden">
            {where && <>{where} · </>}
            {when('')}
          </p>
          {/* Phones: the posting's link, for screen readers only (sighted
              people tap the row). From 768px the ↗ below does this. */}
          {job.posting_url && (
            <a href={job.posting_url} target="_blank" rel="noopener noreferrer" className="sr-only md:hidden">
              Open posting for {heading} (opens in a new tab)
            </a>
          )}
        </div>

        {/* 1280px up: where and when in a column of their own. */}
        <div className="hidden min-w-0 text-[0.9375rem] text-muted [grid-area:where] xl:block">
          <p className="flex min-w-0 items-center gap-2">
            {job.posting_url && <GlobeIcon />}
            <span className="truncate" title={where}>{where || '—'}</span>
          </p>
          <p className={`mt-1 text-sm ${job.posting_url ? 'pl-6' : ''}`}>{when('Added ')}</p>
        </div>

        {/* Phones: the status on a second line. From 768px it moves to its own
            column. */}
        {showStatus && (
          <div className="mt-2 [grid-area:extra] md:[grid-area:status] md:mt-0">
            <StatusBadge status={job.status} outcome={job.outcome} />
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
      </div>
    </li>
  )
}

// A bin: shown behind a row being swiped away.
function BinIcon({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 12a2 2 0 002 2h7a2 2 0 002-2l1-12M9 7V4.5A1.5 1.5 0 0110.5 3h3A1.5 1.5 0 0115 4.5V7" />
    </svg>
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
