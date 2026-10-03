import { useMenu } from '../lib/useMenu.js'

// The ⋮ button on a job card and the small menu it opens.
//
// What it offers depends on where the job is:
//   To Apply:  Mark as Done · Mark as Accepted · Mark as Rejected · Delete Job
//   Pending:   Mark as Accepted · Mark as Rejected · Move back to To Apply · Delete Job
//   Accepted:  Mark as Rejected · Move back to To Apply · Delete Job
//   Rejected:  Mark as Accepted · Move back to To Apply · Delete Job
//
// It closes when you pick something, press Esc, or click anywhere outside it
// (lib/useMenu.js). Picking reports onSetStatus(status, outcome) or onDelete();
// the page decides what that means.
export default function CardMenu({ label, status, outcome, onSetStatus, onDelete }) {
  const { open, setOpen, wrapper, button } = useMenu()

  const toApply = status !== 'done'
  const actions = [
    toApply && { key: 'done', label: 'Mark as Done', icon: CheckIcon, className: 'text-done', status: 'done', outcome: 'pending' },
    outcome !== 'accepted' && { key: 'accepted', label: 'Mark as Accepted', icon: CheckCircleIcon, className: 'text-done', status: 'done', outcome: 'accepted' },
    outcome !== 'rejected' && { key: 'rejected', label: 'Mark as Rejected', icon: XCircleIcon, className: 'text-error', status: 'done', outcome: 'rejected' },
    !toApply && { key: 'to_apply', label: 'Move back to To Apply', icon: BackIcon, className: 'text-todo', status: 'to_apply', outcome: null },
  ].filter(Boolean)

  return (
    <div ref={wrapper} className="relative shrink-0">
      <button
        ref={button}
        type="button"
        aria-label={`More actions for ${label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className="flex size-11 items-center justify-center rounded-lg text-accent hover:bg-subtle hover:text-ink"
      >
        <svg className="size-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <circle cx="10" cy="4" r="1.75" />
          <circle cx="10" cy="10" r="1.75" />
          <circle cx="10" cy="16" r="1.75" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-label={`Actions for ${label}`}
          className="menu-in absolute top-full right-0 z-10 mt-1 w-60 origin-top-right rounded-card border border-line bg-surface p-1 shadow-lg"
        >
          {actions.map((action, index) => (
            <button
              key={action.key}
              type="button"
              role="menuitem"
              // Opening the menu moves focus into it, so Enter picks straight away.
              autoFocus={index === 0}
              onClick={() => {
                setOpen(false)
                onSetStatus(action.status, action.outcome)
              }}
              className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-semibold text-ink hover:bg-subtle"
            >
              <action.icon className={`size-4 shrink-0 ${action.className}`} />
              {action.label}
            </button>
          ))}

          {/* A thin line, then Delete in red, so it isn't tapped by mistake. */}
          <div className="my-1 border-t border-line" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onDelete()
            }}
            className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-semibold text-error hover:bg-red-50"
          >
            <svg className="size-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2.5 4h11M6 4V2.5h4V4M4 4l.7 9.5h6.6L12 4M6.75 6.5v4.5M9.25 6.5v4.5" />
            </svg>
            Delete Job
          </button>
        </div>
      )}
    </div>
  )
}

function CheckIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckCircleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="8" r="6.25" />
      <path d="M5.25 8.25l1.9 1.9 3.6-4" />
    </svg>
  )
}

function XCircleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
      <circle cx="8" cy="8" r="6.25" />
      <path d="M5.75 5.75l4.5 4.5M10.25 5.75l-4.5 4.5" />
    </svg>
  )
}

function BackIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8a5 5 0 105-5H5M5 3L3 5m2-2L3 1" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
