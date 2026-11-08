// The search box, sort menu, Favourites filter, Select button and List | Board
// switch above the jobs on My Stash.
//
// It only reports what was typed or picked; StashPage decides what that means
// for the list.

import { useEffect, useState } from 'react'
import SortMenu from './SortMenu.jsx'

// Phones (under 768px) get the one-row toolbar below.
const PHONE = '(width < 48rem)'

function usePhone() {
  const [phone, setPhone] = useState(() => window.matchMedia(PHONE).matches)
  useEffect(() => {
    const query = window.matchMedia(PHONE)
    const update = () => setPhone(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return phone
}

export const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'company', label: 'Company A–Z' },
]

export default function StashToolbar({
  query, onQueryChange, sort, onSortChange,
  favoritesOnly, onFavoritesOnlyChange, view, onViewChange,
  selecting, onSelectingChange,
}) {
  const phone = usePhone()
  const otherView = VIEWS.find((option) => option.value !== view) ?? VIEWS[1]

  return (
    // Phones: one row, so more of the jobs fit on the first screen.
    //   [ search      ] [☆] [☐] [⇅] [▥]
    // Sort and the view switch are icon buttons there; sort's list still
    // shows the order in use, with a ✓.
    // 768px up: one row, in the same order as the code below, with sort
    // and the List | Board switch written out.
    <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto_auto] items-center gap-1.5 max-[359px]:gap-1 md:flex md:gap-3">
      <div className="relative col-start-1 row-start-1 md:flex-1">
        <label htmlFor="job-search" className="sr-only">Search jobs or companies</label>
        {/* Under 360px wide the box is too narrow for the magnifier and the
            word "Search" both; the word stays. */}
        <svg className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted max-[359px]:hidden md:left-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="9" cy="9" r="6" />
          <path d="M13.5 13.5L17 17" />
        </svg>
        <input
          id="job-search"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          // Short on phones, where the box is narrower.
          placeholder={phone ? 'Search' : 'Search jobs or companies...'}
          autoComplete="off"
          // The browser's own clear button is hidden; ours below looks the same everywhere.
          // Room on the right for the ✕ only while there's something to clear.
          // Under 360px wide (the smallest phones) no magnifier and a little
          // tighter, so "Search" still fits beside the four buttons.
          className={`min-h-11 w-full rounded-card border border-line bg-surface pl-3 text-base text-ellipsis placeholder:text-muted min-[360px]:min-h-12 min-[360px]:pl-10 md:min-h-13.5 md:pl-12 [&::-webkit-search-cancel-button]:appearance-none ${
            query ? 'pr-11 md:pr-12' : 'pr-2 min-[360px]:pr-3 md:pr-4'
          }`}
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

      {/* Sort. Phones: a ⇅ button at the end of the row (its list opens
          leftward). From 768px: "⇅ Newest first ⌄" in a box. */}
      <div className="col-start-4 row-start-1">
        <SortMenu value={sort} options={SORTS} onChange={onSortChange} />
      </div>

      {/* Only starred jobs. Below 1280px just the star, to save room. */}
      <button
        type="button"
        aria-pressed={favoritesOnly}
        onClick={() => onFavoritesOnlyChange(!favoritesOnly)}
        title="Show only favourites"
        className={`col-start-2 row-start-1 inline-flex size-11 items-center justify-center gap-1.5 rounded-card border font-semibold min-[360px]:size-12 md:size-13.5 xl:h-13.5 xl:w-auto xl:px-4 ${
          favoritesOnly ? 'border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-400/60 dark:bg-amber-400/10 dark:text-amber-300' : 'border-line bg-surface text-ink hover:bg-subtle'
        }`}
      >
        <svg
          className={`size-5 ${favoritesOnly ? 'fill-amber-400 stroke-amber-600' : 'fill-none stroke-current'}`}
          viewBox="0 0 20 20" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true"
        >
          <path d="M10 2.5l2.3 4.7 5.2.8-3.8 3.6.9 5.1L10 14.3l-4.6 2.4.9-5.1L2.5 8l5.2-.8z" />
        </svg>
        <span className="max-xl:sr-only">Favourites</span>
      </button>

      {/* Select mode: tick boxes appear beside the jobs, with a bar to
          delete the ticked ones. Pressed again (or Cancel in the bar), it
          ends. Below 1280px just the tick-box icon. */}
      <button
        type="button"
        aria-pressed={selecting}
        onClick={() => onSelectingChange(!selecting)}
        title={selecting ? 'Stop selecting' : 'Select jobs'}
        className={`col-start-3 row-start-1 inline-flex size-11 items-center justify-center gap-1.5 rounded-card border font-semibold min-[360px]:size-12 md:size-13.5 xl:h-13.5 xl:w-auto xl:px-4 ${
          selecting ? 'border-brand-blue/40 bg-todo-bg text-brand-blue' : 'border-line bg-surface text-ink hover:bg-subtle'
        }`}
      >
        <svg className="size-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="14" height="14" rx="3" />
          {selecting && <path d="M6.5 10.2l2.4 2.4 4.6-5.1" />}
        </svg>
        <span className="max-xl:sr-only">Select</span>
      </button>

      {/* Phones: one button that switches to the other view, showing that
          view's icon (the board icon while you're on the list). */}
      <button
        type="button"
        onClick={() => onViewChange(otherView.value)}
        aria-label={`Switch to ${otherView.label.toLowerCase()}`}
        title={`Switch to ${otherView.label.toLowerCase()}`}
        className="col-start-5 row-start-1 inline-flex size-11 items-center justify-center rounded-card border border-line bg-surface text-ink hover:bg-subtle min-[360px]:size-12 md:hidden"
      >
        <otherView.icon />
      </button>

      {/* 768px up: List | Board. The blue highlight behind the chosen button
          slides across when you switch, one button's width at a time (48px
          buttons, so the whole switch is 54px tall like the rest of the
          row). */}
      <div className="relative hidden rounded-lg border border-line bg-surface p-0.5 md:flex" role="group" aria-label="View">
        <span
          aria-hidden="true"
          className="absolute top-0.5 left-0.5 size-12 rounded-md bg-todo-bg ring-1 ring-brand-blue/30 transition-transform duration-200 ease-out"
          style={{ transform: `translateX(${Math.max(0, VIEWS.findIndex((option) => option.value === view)) * 100}%)` }}
        />
        {VIEWS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={view === option.value}
            aria-label={option.label}
            title={option.label}
            onClick={() => onViewChange(option.value)}
            className={`relative flex size-12 items-center justify-center rounded-md ${
              view === option.value ? 'text-brand-blue' : 'text-accent hover:text-ink'
            }`}
          >
            <option.icon />
          </button>
        ))}
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
