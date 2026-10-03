// The All | Accepted | Rejected row under the tabs, shown on the Done tab.
// "All" is every done job, including those still Pending.
//
// Real buttons, so they can be reached with Tab and pressed with Enter.
// aria-pressed tells a screen reader which one is picked.

const OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
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
            className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold max-[359px]:gap-1 max-[359px]:px-2 md:gap-2 md:px-4 ${
              active
                ? 'border-brand-blue bg-todo-bg text-brand-blue'
                : 'border-line bg-surface text-ink hover:border-accent'
            }`}
          >
            {option.label}
            <span className={`rounded-full px-1.5 max-[359px]:px-1 md:px-2 ${active ? 'bg-white' : 'bg-subtle'}`}>
              {counts[option.value]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
