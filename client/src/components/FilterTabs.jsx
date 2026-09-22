// The To Apply / Done / All tabs on My Stash, each with how many jobs it holds.
//
// Real buttons, so they can be reached with Tab and pressed with Enter.
// aria-pressed tells a screen reader which one is picked.

const TABS = [
  { value: 'to_apply', label: 'To Apply' },
  { value: 'done', label: 'Done' },
  { value: 'all', label: 'All' },
]

export default function FilterTabs({ value, counts, onChange }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Show jobs">
      {TABS.map((tab) => {
        const active = tab.value === value
        return (
          <button
            key={tab.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(tab.value)}
            className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold ${
              active ? 'bg-primary text-white' : 'bg-subtle text-ink hover:bg-line'
            }`}
          >
            {tab.label}
            {/* Dark text on grey, never grey on grey: that pair failed the
                contrast check in the design system. */}
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                active ? 'bg-white text-primary' : 'bg-line text-ink'
              }`}
            >
              {counts[tab.value]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
