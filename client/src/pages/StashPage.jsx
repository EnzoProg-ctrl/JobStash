import { useEffect, useRef, useState } from 'react'
import { deleteJob, setFavorite, setJobStatus } from '../api'
import DemoNotice from '../components/DemoNotice.jsx'
import DoneFilter from '../components/DoneFilter.jsx'
import FilterTabs from '../components/FilterTabs.jsx'
import JobCard from '../components/JobCard.jsx'
import JobCardSkeleton from '../components/JobCardSkeleton.jsx'
import StashBoard from '../components/StashBoard.jsx'
import StashToolbar from '../components/StashToolbar.jsx'
import UndoToast from '../components/UndoToast.jsx'
import { smoothly } from '../lib/motion.js'
import { usePageTitle } from '../lib/usePageTitle.js'
import { useJobs } from '../lib/useJobs.js'
import { Outlet } from 'react-router'

// Shown when a tab has nothing in it. Different from the page having no jobs
// at all, which gets its own message below.
const EMPTY_TAB = {
  to_apply: 'Nothing left to apply for. Nice work!',
  done: 'Nothing marked as done yet.',
}
// The same, for the Accepted and Rejected filters on the Done tab.
const EMPTY_OUTCOME = {
  pending: 'Nothing waiting for an answer.',
  accepted: 'No accepted jobs yet.',
  rejected: 'No rejected jobs yet.',
}

const COMPARE = {
  newest: (a, b) => b.added_at.localeCompare(a.added_at),
  oldest: (a, b) => a.added_at.localeCompare(b.added_at),
  // "base" ignores capitals and accents, so "acme" sits next to "Acme".
  company: (a, b) => a.company_name.localeCompare(b.company_name, undefined, { sensitivity: 'base' }),
}

// List or Board, remembered in this browser for next time. Storage can be
// blocked (private windows), so a failure just means starting on the list.
const VIEW_KEY = 'jobstash:view'
function savedView() {
  try {
    return localStorage.getItem(VIEW_KEY) === 'board' ? 'board' : 'list'
  } catch {
    return 'list'
  }
}

// Capitals don't matter, and spaces around the search are ignored.
function matchesSearch(job, query) {
  const words = query.trim().toLowerCase()
  if (!words) return true
  return (
    job.company_name.toLowerCase().includes(words) ||
    job.job_title.toLowerCase().includes(words) ||
    (job.source ?? '').toLowerCase().includes(words)
  )
}

// My Stash: every saved job, filtered by the tabs and the search, sorted, as a
// list or a board. A menu on each job changes its status; Select mode deletes.
export default function StashPage() {
  usePageTitle('My Stash')
  // Loading the list, the "waking up" note and Try again live in lib/useJobs.js,
  // shared with the Overview page.
  const { status, jobs, setJobs, error, slow, retry } = useJobs()
  const [tab, setTab] = useState('to_apply')        // to_apply | done | all
  const [query, setQuery] = useState('')
  // What the list is filtered by. It follows query, but through smoothly(), so
  // the cards can slide; the search box itself always updates straight away.
  const [shownQuery, setShownQuery] = useState('')
  const [sort, setSort] = useState('newest')        // newest | oldest | company
  // The All | Pending | Accepted | Rejected filter, used on the Done tab.
  const [doneFilter, setDoneFilter] = useState('all') // all | pending | accepted | rejected
  // Only starred jobs (the ★ Favourites button), and List or Board.
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [view, setView] = useState(savedView)
  const [actionError, setActionError] = useState(null)
  // The jobs just deleted, while their Undo message shows (5 seconds).
  const [deleted, setDeleted] = useState(null)
  // Select mode, and the ids of the ticked jobs.
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState(() => new Set())
  // The same jobs, plus the 5-second timer, kept where the timer can read them.
  const pending = useRef(null)
  const timer = useRef(null)

  // The card changes straight away, then the change is saved. If saving fails
  // the card goes back to how it was, so the screen never shows something that
  // was not saved.
  //
  // nextStatus is 'done' or 'to_apply'; nextOutcome is how a done job turned
  // out: 'pending' (Mark as Done), 'accepted' or 'rejected'. Moving back to
  // To Apply clears it.
  //
  // { instant: true } skips the slide, for a card dropped on the board, which
  // is already where it was dropped.
  async function handleSetStatus(job, nextStatus, nextOutcome, { instant = false } = {}) {
    const replace = (changed) =>
      setJobs((current) => current.map((row) => (row.id === changed.id ? changed : row)))
    const outcome = nextStatus === 'done' ? (nextOutcome ?? 'pending') : null

    setActionError(null)
    // Smoothly: on the To Apply tab, a job marked done, accepted or rejected
    // fades out and the ones below slide up into its place.
    const change = instant ? (update) => update() : smoothly
    change(() => replace({ ...job, status: nextStatus, outcome }))
    try {
      replace(await setJobStatus(job.id, nextStatus, outcome))
    } catch (caught) {
      smoothly(() => replace(job))
      setActionError(`Couldn't update "${job.job_title || job.company_name}": ${caught.message}`)
    }
  }

  // The star. Like marking done: the card changes straight away, then the
  // change is saved, and if saving fails the star goes back with a message.
  async function handleToggleFavorite(job) {
    const replace = (changed) =>
      setJobs((current) => current.map((row) => (row.id === changed.id ? changed : row)))

    setActionError(null)
    replace({ ...job, favorite: !job.favorite })
    try {
      replace(await setFavorite(job.id, !job.favorite))
    } catch (caught) {
      replace(job)
      setActionError(`Couldn't ${job.favorite ? 'unstar' : 'star'} "${job.job_title || job.company_name}": ${caught.message}`)
    }
  }

  // Delete: the card disappears straight away, and the Undo message shows for
  // 5 seconds. Only when the time is up is the job really deleted, so Undo can
  // bring it back exactly as it was.
  // Deleting is done from Select mode, one job or many at once (gone).
  function handleDelete(gone) {
    // Jobs still waiting from an earlier Delete are deleted for real now.
    clearTimeout(timer.current)
    if (pending.current) pending.current.forEach(reallyDelete)

    setActionError(null)
    const ids = new Set(gone.map((job) => job.id))
    smoothly(() => setJobs((current) => current.filter((row) => !ids.has(row.id))))
    pending.current = gone
    setDeleted(gone)
    timer.current = setTimeout(() => {
      gone.forEach(reallyDelete)
      pending.current = null
      setDeleted(null)
    }, 5000)
  }

  // Undo: stop the timer and put the jobs back. The list is sorted, so they
  // land in their old places by themselves.
  function handleUndo() {
    clearTimeout(timer.current)
    const back = pending.current
    pending.current = null
    setDeleted(null)
    smoothly(() => setJobs((current) => [...back, ...current]))
  }

  // The real delete, on the server. If it fails, the job comes back with a
  // message, so nothing disappears that wasn't really deleted.
  async function reallyDelete(job) {
    try {
      await deleteJob(job.id)
    } catch (caught) {
      smoothly(() => setJobs((current) => [job, ...current]))
      setActionError(`Couldn't delete "${job.job_title || job.company_name}": ${caught.message}`)
    }
  }

  // Leaving My Stash within the 5 seconds: the waiting jobs are deleted on the
  // way out, instead of being forgotten when the timer disappears with the page.
  useEffect(() => {
    return () => {
      clearTimeout(timer.current)
      pending.current?.forEach((job) => deleteJob(job.id).catch(() => {}))
    }
  }, [])

  // Select mode (the Select button in the toolbar): a tick box on every job,
  // and a bar to delete the ticked ones. Off by default.
  function changeSelecting(on) {
    setSelecting(on)
    setSelected(new Set())
  }

  function toggleSelected(job) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(job.id)) next.delete(job.id)
      else next.add(job.id)
      return next
    })
  }

  // Called by the Add Job pop-up after it saves. The new job goes first because
  // it is the newest, and the tab and search are reset so it is always visible.
  function handleJobSaved(job) {
    smoothly(() => {
      setJobs((current) => [job, ...current])
      setTab('to_apply')
      setQuery('')
      setShownQuery('')
    })
  }

  // Changing the search or the sort only rearranges the cards, so the cards
  // slide into their new places instead of the list jumping. Changing the tab
  // swaps almost every card at once: the old ones fading out over the new ones
  // looked like flicker, so tabs switch straight away, like in most apps.
  const showTab = (value) => setTab(value)
  const search = (value) => {
    setQuery(value)
    smoothly(() => setShownQuery(value))
  }
  const sortBy = (value) => smoothly(() => setSort(value))
  const showFavoritesOnly = (value) => smoothly(() => setFavoritesOnly(value))
  // Each job card glides from its place in the list to its place on the
  // board, and back (the cards in both views share a name, lib/motion.js).
  const changeView = (value) => {
    if (value === view) return
    // The two views show different jobs (the board ignores the tabs), so
    // switching starts Select mode afresh.
    smoothly(() => {
      setView(value)
      changeSelecting(false)
    }, { className: 'switching-view' })
    try {
      localStorage.setItem(VIEW_KEY, value)
    } catch {
      // Not remembered this time; nothing else changes.
    }
  }

  // All jobs are already loaded, so the tabs, search and sort only rearrange
  // what is here. No extra request.
  //
  // The counts follow the search, so searching "intern" shows how many matches
  // each tab has.
  // The counts follow the Favourites filter in the same way.
  const matches = jobs.filter(
    (job) => matchesSearch(job, shownQuery) && (!favoritesOnly || job.favorite)
  )
  const counts = {
    to_apply: matches.filter((job) => job.status === 'to_apply').length,
    done: matches.filter((job) => job.status === 'done').length,
    all: matches.length,
  }
  const doneMatches = matches.filter((job) => job.status === 'done')
  const doneCounts = {
    all: doneMatches.length,
    pending: doneMatches.filter((job) => job.outcome === 'pending').length,
    accepted: doneMatches.filter((job) => job.outcome === 'accepted').length,
    rejected: doneMatches.filter((job) => job.outcome === 'rejected').length,
  }
  // For the line under the title: every saved job, whatever the search says.
  const toApplyTotal = jobs.filter((job) => job.status !== 'done').length
  // filter() already makes a new array, so sorting it leaves `jobs` untouched.
  const visible = matches
    .filter((job) => tab === 'all' || job.status === tab)
    .filter((job) => tab !== 'done' || doneFilter === 'all' || job.outcome === doneFilter)
    .sort(COMPARE[sort])
  // The board has no tabs: it shows every match, in its columns.
  const boardJobs = [...matches].sort(COMPARE[sort])
  const onScreen = view === 'board' ? boardJobs : visible
  // Ticked jobs that are on screen now: those are the ones Delete acts on, so
  // nothing hidden by a tab or a search is deleted by surprise.
  const selectedVisible = onScreen.filter((job) => selected.has(job.id))
  const allSelected = onScreen.length > 0 && selectedVisible.length === onScreen.length

  function selectAll(on) {
    setSelected(on ? new Set(onScreen.map((job) => job.id)) : new Set())
  }

  function deleteSelected() {
    if (!selectedVisible.length) return
    handleDelete(selectedVisible)
    changeSelecting(false)
  }

  return (
    <section>
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        {/* A plain title: the brand column (BrandAside.jsx) already says what
            JobStash is for. Under it, where the stash stands right now, from
            every saved job (searching doesn't change it). The line keeps its
            height while loading, so nothing jumps when the numbers arrive. */}
        <div>
          <h1 className="text-[2rem] leading-[1.1] font-bold tracking-tight text-ink md:text-[2.75rem]">My Stash</h1>
          <p className="mt-3 min-h-7 text-lg text-muted">
            {status === 'ready' && jobs.length > 0 && (
              <>
                <span className="font-semibold text-brand-blue">{toApplyTotal} to apply</span>
                {' · '}
                <span className="font-semibold text-ink">{jobs.length - toApplyTotal} done</span>
                {' · '}
                {jobs.length} saved in total
              </>
            )}
          </p>
        </div>
        <DemoNotice className="md:max-w-sm" />
      </div>

      {/* Four states, and each looks different. An empty list means "nothing
          here yet"; an error means "we could not find out". */}
      {/* Loading: grey stand-in cards where the jobs will appear
          (JobCardSkeleton.jsx), so the page already looks like My Stash. After
          5 seconds a note that it's taking longer than usual joins them. */}
      {status === 'loading' && (
        <div className="mt-8" role="status">
          <span className="sr-only">Loading your jobs…</span>
          {slow && (
            <p className="mb-4 text-muted">
              Still loading. This is taking longer than usual; a slow connection can do this.
            </p>
          )}
          <ul className="border-y border-line">
            <JobCardSkeleton />
            <JobCardSkeleton />
            <JobCardSkeleton />
          </ul>
        </div>
      )}

      {status === 'error' && (
        <div className="mt-6 rounded-card border border-line bg-surface p-6" role="alert">
          <p className="text-error">{error.message}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-line px-4 font-semibold text-ink hover:bg-subtle"
          >
            Try again
          </button>
        </div>
      )}

      {status === 'ready' && jobs.length === 0 && (
        <div className="mt-6 rounded-card border border-line bg-surface p-8 text-center">
          <p className="font-bold">Nothing stashed yet.</p>
          <p className="mt-1 text-muted">Found an interesting job? Save it here and apply later.</p>
        </div>
      )}

      {status === 'ready' && jobs.length > 0 && (
        <>
          {/* On the board the columns do the tabs' job, so the tabs and the
              Done filter only show in the list. */}
          {view === 'list' && (
            <div className="mt-8">
              <FilterTabs value={tab} counts={counts} onChange={showTab} />
            </div>
          )}

          {view === 'list' && tab === 'done' && (
            <div className="mt-3">
              <DoneFilter value={doneFilter} counts={doneCounts} onChange={setDoneFilter} />
            </div>
          )}

          <div className={view === 'list' ? 'mt-6' : 'mt-8'}>
            <StashToolbar
              query={query}
              onQueryChange={search}
              sort={sort}
              onSortChange={sortBy}
              favoritesOnly={favoritesOnly}
              onFavoritesOnlyChange={showFavoritesOnly}
              view={view}
              onViewChange={changeView}
              selecting={selecting}
              onSelectingChange={changeSelecting}
            />
          </div>

          {/* Select mode's bar: tick all, how many are ticked, Delete, and the
              way out. It stays at the top of the screen while scrolling. */}
          {selecting && (
            <div
              role="region"
              aria-label="Selected jobs"
              className="sticky top-2 z-10 mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-brand-blue/30 bg-todo-bg px-3 py-2 shadow-sm sm:gap-x-4 sm:px-4"
            >
              <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-ink">
                <input
                  type="checkbox"
                  className="size-5 accent-brand-blue"
                  checked={allSelected}
                  ref={(box) => { if (box) box.indeterminate = selectedVisible.length > 0 && !allSelected }}
                  onChange={(event) => selectAll(event.target.checked)}
                />
                Select all
              </label>
              {/* Phones: only screen readers hear this; the Delete button shows the
                  same number. */}
              <p className="text-sm text-muted max-sm:sr-only" aria-live="polite">
                {selectedVisible.length} selected
              </p>
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={deleteSelected}
                  disabled={!selectedVisible.length}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-error px-4 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-40"
                >
                  <svg className="size-4 max-sm:hidden" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2.5 4h11M6 4V2.5h4V4M4 4l.7 9.5h6.6L12 4M6.75 6.5v4.5M9.25 6.5v4.5" />
                  </svg>
                  Delete{selectedVisible.length ? ` (${selectedVisible.length})` : ''}
                </button>
                <button
                  type="button"
                  onClick={() => changeSelecting(false)}
                  className="inline-flex min-h-11 items-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink hover:bg-subtle"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {actionError && (
            <p className="mt-4 rounded-card border border-line bg-surface p-4 text-error" role="alert">
              {actionError}
            </p>
          )}

          {matches.length === 0 && favoritesOnly && !shownQuery.trim() ? (
            <div className="mt-6 rounded-card border border-line bg-surface p-8 text-center">
              <p className="font-bold">No favourites yet.</p>
              <p className="mt-1 text-muted">Tap the ☆ on a job to add it here.</p>
              <button
                type="button"
                onClick={() => showFavoritesOnly(false)}
                className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-line bg-surface px-4 font-semibold text-brand-blue hover:bg-subtle"
              >
                Show all jobs
              </button>
            </div>
          ) : view === 'board' && matches.length > 0 ? (
            <div className="mt-6">
              <StashBoard
                jobs={boardJobs}
                onSetStatus={handleSetStatus}
                onToggleFavorite={handleToggleFavorite}
                selecting={selecting}
                selected={selected}
                onSelect={toggleSelected}
              />
            </div>
          ) : (view === 'board' ? matches.length === 0 : visible.length === 0) && shownQuery.trim() ? (
            <div className="mt-6 rounded-card border border-line bg-surface p-8 text-center">
              <p className="font-bold">
                No {tab === 'all' || view === 'board' ? 'jobs' : 'jobs on this tab'} match "{shownQuery.trim()}".
              </p>
              <button
                type="button"
                onClick={() => search('')}
                className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-line bg-surface px-4 font-semibold text-brand-blue hover:bg-subtle"
              >
                Clear search
              </button>
            </div>
          ) : visible.length === 0 ? (
            <p className="mt-6 rounded-card border border-line bg-surface p-8 text-center text-muted">
              {tab === 'done' && doneFilter !== 'all' ? EMPTY_OUTCOME[doneFilter] : EMPTY_TAB[tab]}
            </p>
          ) : (
            // One continuous list, a thin line between jobs (JobCard.jsx).
            // The status chip only where it tells you something: not on To
            // Apply, where every job is To Apply.
            <ul className="mt-4 border-y border-line">
              {visible.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  showStatus={tab !== 'to_apply'}
                  onSetStatus={handleSetStatus}
                  onToggleFavorite={handleToggleFavorite}
                  selecting={selecting}
                  selected={selected.has(job.id)}
                  onSelect={() => toggleSelected(job)}
                />
              ))}
            </ul>
          )}
        </>
      )}
      {deleted && (
        <UndoToast
          message={
            deleted.length === 1
              ? `Deleted "${deleted[0].job_title || deleted[0].company_name}"`
              : `Deleted ${deleted.length} jobs`
          }
          onUndo={handleUndo}
        />
      )}
      <Outlet context={{ onJobSaved: handleJobSaved }} />
    </section>
  )
}
