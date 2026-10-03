// The To Apply / Done / All tabs on My Stash: a card each, with an icon and
// how many jobs it holds.
//
// Real buttons, so they can be reached with Tab and pressed with Enter.
// aria-pressed tells a screen reader which one is picked.

const TABS = [
  { value: 'to_apply', label: 'To Apply', icon: ApplyIcon },
  { value: 'done', label: 'Done', icon: CheckIcon },
  { value: 'all', label: 'All', icon: GridIcon },
]

export default function FilterTabs({ value, counts, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2 md:max-w-3xl md:gap-3" role="group" aria-label="Show jobs">
      {TABS.map((tab) => {
        const active = tab.value === value
        return (
          <button
            key={tab.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(tab.value)}
            // Phones: a plain icon beside the label and count, as in the phone
            // design (on the narrowest phones, under 360px, the icon goes above
            // so "To Apply" still fits on one line). From 768px the icon sits in
            // a circle and the count in a pill.
            className={`flex items-center gap-1.5 rounded-card border px-2 py-3 text-left max-[359px]:flex-col max-[359px]:items-start md:gap-4 md:p-4 ${
              active
                ? 'border-brand-blue bg-todo-bg'
                : 'border-line bg-surface hover:border-accent'
            }`}
          >
            <span
              className={`flex shrink-0 items-center justify-center rounded-full md:size-12 ${
                active ? 'text-brand-blue md:bg-white' : 'text-ink md:bg-subtle'
              }`}
            >
              <tab.icon />
            </span>
            <span>
              <span className={`block text-sm font-semibold whitespace-nowrap md:text-base ${active ? 'text-brand-blue' : 'text-ink'}`}>
                {tab.label}
              </span>
              {/* Dark text on grey, never grey on grey: that pair failed the
                  contrast check in the design system. */}
              <span
                className={`inline-block rounded-full text-sm md:mt-1 md:px-2 ${
                  active ? 'text-brand-blue md:bg-white' : 'text-ink md:bg-subtle'
                }`}
              >
                {counts[tab.value]}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

function Icon({ children }) {
  return (
    <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

// A page with a folded corner, and an arrow leaving it: a job to send off.
function ApplyIcon() {
  return (
    <Icon>
      <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h5" />
      <path d="M14 3v4a1 1 0 001 1h4M14 3l5 5v4" />
      <path d="M14 21l7-7M16 14h5v5" />
    </Icon>
  )
}

function CheckIcon() {
  return <Icon><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.7 2.7L16 9.5" /></Icon>
}

function GridIcon() {
  return (
    <Icon>
      <circle cx="6" cy="6" r="1.5" fill="currentColor" /><circle cx="12" cy="6" r="1.5" fill="currentColor" /><circle cx="18" cy="6" r="1.5" fill="currentColor" />
      <circle cx="6" cy="12" r="1.5" fill="currentColor" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /><circle cx="18" cy="12" r="1.5" fill="currentColor" />
      <circle cx="6" cy="18" r="1.5" fill="currentColor" /><circle cx="12" cy="18" r="1.5" fill="currentColor" /><circle cx="18" cy="18" r="1.5" fill="currentColor" />
    </Icon>
  )
}
