import useSlider from '../lib/useSlider.js'

// All | Pending | Accepted | Rejected, under the tabs when Applied is chosen
// (the tab's value is still 'done', as stored in the database). Each
// result has its colour dot (the same colours as the status chips): Pending
// blue-grey, Accepted green, Rejected red.
//
// The chosen one has a soft blue capsule behind it that slides to the next
// one when another is picked, like the tabs above it (on phones it fades in
// there instead: lib/useSlider.js). open: the Done tab is showing, so the
// options arrive one after another (the done-filter style in styles.css).
const OPTIONS = [
  { value: 'all', label: 'All', dot: null },
  { value: 'pending', label: 'Pending', dot: 'bg-pending' },
  { value: 'accepted', label: 'Accepted', dot: 'bg-done' },
  { value: 'rejected', label: 'Rejected', dot: 'bg-error' },
]

export default function DoneFilter({ value, counts, onChange, open = true }) {
  const { row, marker } = useSlider('[aria-pressed="true"]', value, { slideFrom: '48rem' })

  return (
    <div
      ref={row}
      data-open={open}
      className="done-filter relative flex flex-wrap gap-1.5 max-[359px]:gap-1 md:gap-2"
      role="group"
      aria-label="Show applied jobs"
    >
      {/* The sliding capsule, behind the options. */}
      <span
        ref={marker}
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 h-(--h) w-(--w) translate-x-(--x) translate-y-(--y) rounded-full border border-brand-blue/40 bg-todo-bg transition-[translate,width,height] duration-300 ease-out"
      />
      {OPTIONS.map((option, index) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            style={{ '--i': index }}
            className={`relative inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold transition-colors duration-300 max-[359px]:gap-1 max-[359px]:px-2 md:px-4 ${
              active
                ? 'border-transparent text-brand-blue'
                : 'border-line bg-surface text-ink hover:bg-subtle'
            }`}
          >
            {option.dot && <span className={`size-2 rounded-full ${option.dot}`} aria-hidden="true" />}
            {option.label}
            <span className={`transition-colors duration-300 ${active ? 'text-brand-blue' : 'text-muted'}`}>
              {counts[option.value]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
