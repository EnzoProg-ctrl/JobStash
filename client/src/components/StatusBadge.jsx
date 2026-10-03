// The status pill on each job card.
//
//   To Apply            blue dot           (status 'to_apply')
//   Pending             blue-grey clock    (done, waiting for an answer)
//   ✓ Accepted          green check        (done, got it)
//   ⊗ Rejected          red circled X      (done, didn't get it)

const pill = 'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold'

export default function StatusBadge({ status, outcome }) {
  if (status === 'done' && outcome === 'accepted') {
    return (
      <span className={`${pill} bg-done-bg text-done`}>
        <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Accepted
      </span>
    )
  }

  if (status === 'done' && outcome === 'rejected') {
    return (
      <span className={`${pill} bg-red-50 text-error`}>
        <svg className="size-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
          <circle cx="8" cy="8" r="6.25" />
          <path d="M5.75 5.75l4.5 4.5M10.25 5.75l-4.5 4.5" />
        </svg>
        Rejected
      </span>
    )
  }

  if (status === 'done') {
    // Pending: applied, no answer yet. Neutral rather than good or bad.
    return (
      <span className={`${pill} bg-slate-100 text-slate-700`}>
        <svg className="size-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="8" cy="8" r="6.25" />
          <path d="M8 4.75V8l2.25 1.5" />
        </svg>
        Pending
      </span>
    )
  }

  return (
    <span className={`${pill} bg-todo-bg text-todo`}>
      <span className="size-2 rounded-full bg-todo" aria-hidden="true" />
      To Apply
    </span>
  )
}
