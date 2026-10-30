import useSlider from '../lib/useSlider.js'

// To Apply | Done | All, with how many jobs each has: one segmented control in
// a row. The chosen one has a soft blue box behind it, which slides to the
// next tab when another is picked, or on phones fades in there
// (lib/useSlider.js). aria-pressed tells screen readers which one is on.
const TABS = [
  { value: 'to_apply', label: 'To Apply', icon: ApplyIcon },
  { value: 'done', label: 'Done', icon: CheckIcon },
  { value: 'all', label: 'All', icon: GridIcon },
]

export default function FilterTabs({ value, counts, onChange }) {
  // Slides from tab to tab from 768px up; on phones it fades in on the new tab.
  const { row, marker } = useSlider('[aria-pressed="true"]', value, { slideFrom: '48rem' })

  return (
    <div
      ref={row}
      className="relative grid w-full grid-cols-3 gap-1 rounded-xl border border-line bg-surface p-1 md:inline-grid md:w-auto"
      role="group"
      aria-label="Show jobs"
    >
      {/* The sliding box, behind the tabs. */}
      <div
        ref={marker}
        aria-hidden="true"
        className="absolute top-0 left-0 h-(--h) w-(--w) translate-x-(--x) translate-y-(--y) rounded-lg bg-todo-bg ring-1 ring-brand-blue/30 transition-[translate,width,height] duration-300 ease-out"
      />
      {TABS.map((tab) => {
        const active = tab.value === value
        return (
          <button
            key={tab.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(tab.value)}
            className={`relative flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-1 text-sm font-semibold whitespace-nowrap transition-colors duration-300 max-[359px]:flex-col max-[359px]:gap-0 max-[359px]:py-1 sm:gap-2 sm:px-2 md:min-w-36 md:px-5 md:text-base ${
              active ? 'text-brand-blue' : 'text-ink hover:bg-subtle'
            }`}
          >
            <tab.icon />
            {tab.label}
            <span
              className={`rounded-full px-1.5 text-xs font-semibold transition-colors duration-300 sm:px-2 md:text-sm ${
                active ? 'bg-white text-brand-blue' : 'bg-subtle text-ink'
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

function Icon({ children }) {
  return (
    <svg
      className="size-5 shrink-0 max-sm:hidden"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

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
