// The search box, sort menu, Favourites filter and List | Board switch above
// the jobs on My Stash.
//
// It only reports what was typed or picked; StashPage decides what that means
// for the list.

import { useRef } from 'react'

export const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'company', label: 'Company A–Z' },
]

export default function StashToolbar({
  query, onQueryChange, sort, onSortChange,
  favoritesOnly, onFavoritesOnlyChange, view, onViewChange,
}) {
  const sortIcon = useRef(null)

  function changeSort(value) {
    flip(sortIcon.current)
    onSortChange(value)
  }

  return (
    <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-3">
      <div className="relative flex-1">
        <label htmlFor="job-search" className="sr-only">Search jobs or companies</label>
        <svg className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="9" cy="9" r="6" />
          <path d="M13.5 13.5L17 17" />
        </svg>
        <input
          id="job-search"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search jobs or companies..."
          autoComplete="off"
          // The browser's own clear button is hidden; ours below looks the same everywhere.
          className="min-h-12 w-full rounded-card border border-line bg-surface pr-12 pl-12 text-base placeholder:text-muted [&::-webkit-search-cancel-button]:appearance-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange('')}
            aria-label="Clear search"
            className="absolute top-1/2 right-1 flex size-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-subtle hover:text-ink"
          >
            <svg className="size-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        )}
      </div>

      {/* Phones: one row under the search box, sort on the left and the
          Favourites filter and view switch on the right. Wider: all in a row. */}
      <div className="flex items-center justify-between gap-2 max-[359px]:gap-1 md:gap-3">
      {/* Sort: the browser's own dropdown, restyled, so it already works with a
          keyboard, on phones and with screen readers. Phones: plain text
          ("⇅ Newest first ⌄"), as in the phone design. From 768px: a box. */}
      <div className="relative md:w-56">
        <label htmlFor="job-sort" className="sr-only">Sort jobs</label>
        <svg ref={sortIcon} className="pointer-events-none absolute top-1/2 left-1 size-5 -translate-y-1/2 text-ink md:left-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 3v14M3 14l3 3 3-3M14 17V3M11 6l3-3 3 3" />
        </svg>
        <select
          id="job-sort"
          value={sort}
          onChange={(event) => changeSort(event.target.value)}
          className="min-h-11 w-full appearance-none rounded-card border border-transparent bg-transparent pr-8 pl-8 text-base font-semibold text-ink max-[359px]:pr-6 max-[359px]:pl-7 max-[359px]:text-sm md:min-h-12 md:border-line md:bg-surface md:pr-10 md:pl-12"
        >
          {SORTS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <svg className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-ink md:right-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 6l4 4 4-4" />
        </svg>
      </div>

        <div className="flex items-center gap-2 max-[359px]:gap-1">
          {/* Only starred jobs. On phones just the star, to save room. */}
          <button
            type="button"
            aria-pressed={favoritesOnly}
            onClick={() => onFavoritesOnlyChange(!favoritesOnly)}
            title="Show only favourites"
            className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3 text-sm max-[359px]:px-2 font-semibold ${
              favoritesOnly ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-line bg-surface text-ink hover:bg-subtle'
            }`}
          >
            <svg
              className={`size-5 ${favoritesOnly ? 'fill-amber-400 stroke-amber-600' : 'fill-none stroke-current'}`}
              viewBox="0 0 20 20" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true"
            >
              <path d="M10 2.5l2.3 4.7 5.2.8-3.8 3.6.9 5.1L10 14.3l-4.6 2.4.9-5.1L2.5 8l5.2-.8z" />
            </svg>
            <span className="max-md:sr-only">Favourites</span>
          </button>

          {/* List | Board */}
          <div className="flex rounded-lg border border-line bg-surface p-0.5" role="group" aria-label="View">
            {VIEWS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={view === option.value}
                aria-label={option.label}
                title={option.label}
                onClick={() => onViewChange(option.value)}
                className={`flex size-10 items-center justify-center rounded-md ${
                  view === option.value ? 'bg-todo-bg text-brand-blue' : 'text-accent hover:text-ink'
                }`}
              >
                <option.icon />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// A small "got it" when the sort changes: the ⇅ icon spins half a turn,
// grows a little and turns blue, then settles. ⇅ looks the same upside down,
// so it ends exactly as it started. Skipped when the device asks for less
// motion.
function flip(icon) {
  if (!icon?.animate) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const blue = getComputedStyle(document.documentElement).getPropertyValue('--color-brand-blue')
  icon.animate(
    [
      { transform: 'rotate(0deg) scale(1)' },
      { transform: 'rotate(110deg) scale(1.25)', color: blue, offset: 0.45 },
      { transform: 'rotate(180deg) scale(1)' },
    ],
    { duration: 350, easing: 'cubic-bezier(0.34, 1.4, 0.64, 1)' },
  )
}

const VIEWS = [
  { value: 'list', label: 'List view', icon: ListIcon },
  { value: 'board', label: 'Board view', icon: BoardIcon },
]

function ListIcon() {
  return (
    <svg className="size-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
      <path d="M7 5h10M7 10h10M7 15h10M3.5 5h.01M3.5 10h.01M3.5 15h.01" />
    </svg>
  )
}

// Three columns of cards: the Kanban board.
function BoardIcon() {
  return (
    <svg className="size-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.5" y="3" width="4" height="13" rx="1" />
      <rect x="8" y="3" width="4" height="9" rx="1" />
      <rect x="13.5" y="3" width="4" height="11" rx="1" />
    </svg>
  )
}
