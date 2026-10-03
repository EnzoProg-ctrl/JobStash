// The search box, sort menu, Favourites filter and List | Board switch above
// the jobs on My Stash.
//
// It only reports what was typed or picked; StashPage decides what that means
// for the list.

import SortMenu from './SortMenu.jsx'

export const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'company', label: 'Company A–Z' },
]

export default function StashToolbar({
  query, onQueryChange, sort, onSortChange,
  favoritesOnly, onFavoritesOnlyChange, view, onViewChange,
}) {
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
      {/* Sort: "⇅ Newest first ⌄". Phones: plain text, as in the phone
          design. From 768px: a box. */}
      <SortMenu value={sort} options={SORTS} onChange={onSortChange} />

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
