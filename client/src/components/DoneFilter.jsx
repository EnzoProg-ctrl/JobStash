// All | Pending | Accepted | Rejected, under the tabs when Done is chosen. Each
// result has its colour dot (the same colours as the status chips): Pending
// blue-grey, Accepted green, Rejected red.
const OPTIONS = [
  { value: 'all', label: 'All', dot: null },
  { value: 'pending', label: 'Pending', dot: 'bg-pending' },
  { value: 'accepted', label: 'Accepted', dot: 'bg-done' },
  { value: 'rejected', label: 'Rejected', dot: 'bg-error' },
]

export default function DoneFilter({ value, counts, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5 max-[359px]:gap-1 md:gap-2" role="group" aria-label="Show done jobs">
      {OPTIONS.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold max-[359px]:gap-1 max-[359px]:px-2 md:px-4 ${
              active
                ? 'border-brand-blue/40 bg-todo-bg text-brand-blue'
                : 'border-line bg-surface text-ink hover:bg-subtle'
            }`}
          >
            {option.dot && <span className={`size-2 rounded-full ${option.dot}`} aria-hidden="true" />}
            {option.label}
            <span className="text-muted">{counts[option.value]}</span>
          </button>
        )
      })}
    </div>
  )
}
