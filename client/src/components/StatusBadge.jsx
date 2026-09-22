// The To Apply / Done pill on each job card.

export default function StatusBadge({ status }) {
  if (status === 'done') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-done-bg px-3 py-1 text-sm font-semibold text-done">
        <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Done
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-todo-bg px-3 py-1 text-sm font-semibold text-todo">
      <span className="size-2 rounded-full bg-todo" aria-hidden="true" />
      To Apply
    </span>
  )
}
