import { useDraggable } from '@dnd-kit/core'
import CardMenu from './CardMenu.jsx'
import FavoriteButton from './FavoriteButton.jsx'
import { avatarColour, siteName, timeAgo } from '../lib/format.js'

// One job on the board (StashBoard.jsx): a small white tile with a thin
// border, so four columns fit side by side.
//
//   (B) Title                ☆
//       Company
//       LinkedIn · last month
//   ⠿  Open ↗                ⋮
//
// Move it by dragging the card (mouse, or press and hold on a phone), or from
// the keyboard with the ⠿ grip: Space to pick it up, arrow keys to choose a
// column, Space to drop. The ⋮ menu works here too.
//
// selecting: Select mode. A tick box takes the letter circle's place (the
// cards are narrow), tapping the card ticks it, and dragging is off (the grip
// hides).
export default function BoardCard({ job, column, onSetStatus, onToggleFavorite, selecting, selected, onSelect }) {
  const { setNodeRef, setActivatorNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: String(job.id),
    data: { job, column },
    disabled: selecting,
  })
  // Mouse and touch start a drag from anywhere on the card; the keyboard only
  // from the grip, so Enter on the star or the ⋮ still does what it says.
  const { onKeyDown, ...pointerListeners } = listeners ?? {}
  const heading = job.job_title || job.company_name

  return (
    <li
      ref={setNodeRef}
      // Lets this card slide on its own when it changes column from the ⋮ menu
      // (lib/motion.js).
      data-transition-name={`job-${job.id}`}
      {...(selecting ? {} : pointerListeners)}
      onClick={selecting ? (event) => { if (!event.target.closest('a, button, input, label')) onSelect() } : undefined}
      // relative: keeps the hidden "(opens in a new tab)" text inside the card.
      // Without it, on a phone, that text escapes the sideways-scrolling
      // columns and makes the whole page scroll sideways.
      className={`relative touch-manipulation rounded-xl border p-3 transition-[border-color,box-shadow,background-color] ${
        selected
          ? 'border-brand-blue/40 bg-todo-bg ring-1 ring-brand-blue/30'
          : 'border-line bg-surface hover:border-brand-blue/30 hover:shadow-sm'
      } ${selecting ? 'cursor-pointer' : ''} ${isDragging ? 'opacity-40' : ''}`}
    >
      <CardBody job={job}>
        {selecting && (
          <span className="pop-in flex size-9 shrink-0 items-center justify-center">
            <input
              type="checkbox"
              className="select-box size-5 accent-brand-blue"
              checked={selected}
              onChange={onSelect}
              aria-label={`Select ${heading}`}
            />
          </span>
        )}
      </CardBody>
      {/* The star sits in the top right corner, over the card's padding. */}
      <div className="absolute top-0.5 right-0.5">
        <FavoriteButton on={job.favorite} label={heading} onToggle={() => onToggleFavorite(job)} />
      </div>

      <div className="-mx-1 -mb-1.5 mt-1 flex items-center gap-1">
        {!selecting && (
          <button
            ref={setActivatorNodeRef}
            type="button"
            {...attributes}
            onKeyDown={onKeyDown}
            aria-label={`Move ${heading}`}
            className="flex size-11 shrink-0 cursor-grab items-center justify-center rounded-lg text-accent hover:bg-subtle hover:text-ink active:cursor-grabbing"
          >
            <GripIcon />
          </button>
        )}
        {/* No link, no Open: the empty spacer keeps the ⋮ on the right. */}
        {job.posting_url ? <OpenLink url={job.posting_url} /> : <span className="mr-auto" aria-hidden="true" />}
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

// The card as it looks while being dragged: a picture of it that follows the
// pointer, lifted with a shadow. Nothing in it can be pressed.
export function BoardCardPreview({ job }) {
  return (
    <div className="rotate-2 cursor-grabbing rounded-xl border border-brand-blue bg-surface p-3 shadow-xl">
      <CardBody job={job} />
    </div>
  )
}

// The letter circle, title, company, and where and when.
// children: shown instead of the letter circle (the tick box, in Select mode).
function CardBody({ job, children }) {
  const heading = job.job_title || job.company_name
  const subheading = job.job_title ? job.company_name : null
  // The job site, and/or where it was found (a job without a link).
  const where = [siteName(job.posting_url), job.source].filter(Boolean).join(' · ')

  return (
    // pr-8: room for the star in the corner.
    <div className="flex items-start gap-2.5 pr-8">
      {children || (
        // The company name is right beside it, so screen readers skip this.
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg font-bold ${avatarColour(job.company_name)}`}
          aria-hidden="true"
        >
          {job.company_name.charAt(0).toUpperCase()}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="text-sm leading-snug font-semibold text-ink wrap-anywhere">{heading}</h3>
        {subheading && <p className="text-sm text-muted wrap-anywhere">{subheading}</p>}
        <p className="mt-1 text-xs text-muted wrap-anywhere">
          {where && <>{where} · </>}
          <time dateTime={job.added_at}>{timeAgo(job.added_at)}</time>
        </p>
      </div>
    </div>
  )
}

function OpenLink({ url }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="press mr-auto inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-brand-blue hover:bg-todo-bg"
    >
      Open
      <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M9 3h4v4M13 3L7 9M11 9.5V13H3V5h3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  )
}

function GripIcon() {
  return (
    <svg className="size-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <circle cx="7.5" cy="5" r="1.4" /><circle cx="12.5" cy="5" r="1.4" />
      <circle cx="7.5" cy="10" r="1.4" /><circle cx="12.5" cy="10" r="1.4" />
      <circle cx="7.5" cy="15" r="1.4" /><circle cx="12.5" cy="15" r="1.4" />
    </svg>
  )
}
