// A grey stand-in for a job card, shown while My Stash is loading.
//
// It has the same grid as JobCard.jsx, so when the real cards arrive they land
// exactly where the grey shapes were, and nothing jumps:
//   phone:    [circle] [title / company / site] [★ ⋮]
//                      [chip]          [Open Posting]
//   768px up: [circle] [title / company / site] [chip] [Open Posting] [★ ⋮]
//
// It pulses gently (animate-pulse). People whose device asks for less motion
// get it still (styles.css). It's only a picture, so screen readers skip it;
// the page tells them "Loading your jobs…" instead.
export default function JobCardSkeleton() {
  return (
    <li
      aria-hidden="true"
      className="grid animate-pulse grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-3 rounded-card border border-line bg-surface p-4 shadow-sm md:grid-cols-[auto_1fr_auto_auto] md:gap-x-6 md:px-6 md:py-5"
    >
      <span className="col-start-1 row-start-1 size-12 self-start rounded-full bg-line md:size-14 md:self-center" />

      <div className="col-start-2 row-start-1 flex min-w-0 flex-col gap-2">
        <span className="h-4 w-3/4 max-w-56 rounded bg-line md:h-5" />
        <span className="h-4 w-1/2 max-w-40 rounded bg-line" />
        <span className="h-3 w-2/3 max-w-48 rounded bg-subtle" />
      </div>

      <div className="col-span-3 col-start-1 row-start-2 flex items-center justify-between gap-3 md:col-span-1 md:col-start-3 md:row-start-1 md:justify-start md:gap-6">
        <span className="h-7 w-24 rounded-full bg-subtle" />
        <span className="h-11 w-36 rounded-lg border border-line" />
      </div>

      <div className="col-start-3 row-start-1 flex items-center gap-2 self-start md:col-start-4 md:self-center">
        <span className="size-6 rounded-full bg-subtle" />
        <span className="h-6 w-2 rounded-full bg-subtle" />
      </div>
    </li>
  )
}
