import { useDraggable } from '@dnd-kit/core'
import CardMenu from './CardMenu.jsx'
import FavoriteButton from './FavoriteButton.jsx'
import { avatarColour, siteName, timeAgo } from '../lib/format.js'

// One job on the board (StashBoard.jsx): a smaller card than the list's, so
// four columns fit side by side.
//
// Move it by dragging the card (mouse, or press and hold on a phone), or from
// the keyboard with the ⠿ grip: Space to pick it up, arrow keys to choose a
// column, Space to drop. The ⋮ menu works here too.
export default function BoardCard({ job, column, onSetStatus, onDelete, onToggleFavorite }) {
  const { setNodeRef, setActivatorNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: String(job.id),
    data: { job, column },
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
      {...pointerListeners}
      // relative: keeps the hidden "(opens in a new tab)" text inside the card.
      // Without it, on a phone, that text escapes the sideways-scrolling
      // columns and makes the whole page scroll sideways.
      className={`relative touch-manipulation rounded-card border border-line bg-surface p-2.5 shadow-sm ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <CardBody job={job}>
        <FavoriteButton on={job.favorite} label={heading} onToggle={() => onToggleFavorite(job)} />
      </CardBody>
      <div className="mt-1 flex items-center gap-1">
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
        <OpenLink url={job.posting_url} />
        <CardMenu
          label={heading}
          status={job.status}
          outcome={job.outcome}
          onSetStatus={(status, outcome) => onSetStatus(job, status, outcome)}
          onDelete={() => onDelete(job)}
        />
      </div>
    </li>
  )
}

// The card as it looks while being dragged: a picture of it that follows the
// pointer, lifted with a shadow. Nothing in it can be pressed.
export function BoardCardPreview({ job }) {
  return (
    <div className="rotate-2 cursor-grabbing rounded-card border border-brand-blue bg-surface p-2.5 shadow-xl">
      <CardBody job={job} />
    </div>
  )
}

// children: shown at the top right (the star, on the real card).
function CardBody({ job, children }) {
  const heading = job.job_title || job.company_name
  const subheading = job.job_title ? job.company_name : null
  const site = siteName(job.posting_url)

  return (
    <div className="flex items-start gap-2">
      <span
        className={`flex size-8 shrink-0 text-sm items-center justify-center rounded-full font-bold ${avatarColour(job.company_name)}`}
        aria-hidden="true"
      >
        {job.company_name.charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold wrap-anywhere">{heading}</h3>
        {subheading && <p className="text-sm wrap-anywhere">{subheading}</p>}
        <p className="mt-0.5 text-xs text-muted wrap-anywhere">
          {site && <>{site} · </>}
          <time dateTime={job.added_at}>{timeAgo(job.added_at)}</time>
        </p>
      </div>
      {children && <div className="-mt-2.5 -mr-2.5 shrink-0">{children}</div>}
    </div>
  )
}

function OpenLink({ url }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="press mr-auto inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-brand-blue hover:bg-subtle"
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
