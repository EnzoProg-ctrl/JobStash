// The search box and sort menu above the job list on My Stash.
//
// It only reports what was typed or picked; StashPage decides what that means
// for the list.

export const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'company', label: 'Company A–Z' },
]

export default function StashToolbar({ query, onQueryChange, sort, onSortChange }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row">
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

      {/* The browser's own dropdown, restyled: it already works with a
          keyboard, on phones and with screen readers. */}
      <div className="relative md:w-56">
        <label htmlFor="job-sort" className="sr-only">Sort jobs</label>
        <svg className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 3v14M3 14l3 3 3-3M14 17V3M11 6l3-3 3 3" />
        </svg>
        <select
          id="job-sort"
          value={sort}
          onChange={(event) => onSortChange(event.target.value)}
          className="min-h-12 w-full appearance-none rounded-card border border-line bg-surface pr-10 pl-12 text-base font-semibold text-ink"
        >
          {SORTS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <svg className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-ink" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 6l4 4 4-4" />
        </svg>
      </div>
    </div>
  )
}
