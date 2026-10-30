// A grey stand-in for a job row, shown while My Stash is loading.
//
// It has the same grid as JobCard.jsx, so when the real jobs arrive they land
// exactly where the grey shapes were, and nothing jumps.
//
// It pulses gently (animate-pulse). People whose device asks for less motion
// get it still (styles.css). It's only a picture, so screen readers skip it;
// the page tells them "Loading your jobs…" instead.
export default function JobCardSkeleton() {
  return (
    <li
      aria-hidden="true"
      className="grid animate-pulse grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 border-b border-line px-2 py-3.5 last:border-b-0 md:grid-cols-[auto_minmax(0,1fr)_8.5rem_auto] xl:grid-cols-[auto_minmax(0,1fr)_10rem_8.5rem_auto] md:gap-x-5 md:px-4 md:py-3"
    >
      <span className="col-start-1 row-start-1 size-11 self-start rounded-xl bg-line md:self-center" />

      <div className="col-start-2 row-start-1 flex min-w-0 flex-col gap-2">
        <span className="h-4 w-3/4 max-w-56 rounded bg-line md:h-5" />
        <span className="h-4 w-1/2 max-w-40 rounded bg-subtle" />
      </div>

      <div className="hidden flex-col gap-2 xl:col-start-3 xl:row-start-1 xl:flex">
        <span className="h-3 w-28 rounded bg-subtle" />
        <span className="h-3 w-20 rounded bg-subtle" />
      </div>

      <div className="col-span-3 col-start-1 row-start-2 flex justify-end pl-14 md:col-span-1 md:col-start-3 md:row-start-1 md:pl-0 xl:col-start-4">
        <span className="h-4 w-28 rounded bg-subtle" />
      </div>

      <div className="col-start-3 row-start-1 flex items-center gap-3 self-start md:col-start-4 md:self-center xl:col-start-5">
        <span className="size-6 rounded-full bg-subtle" />
        <span className="h-6 w-2 rounded-full bg-subtle" />
      </div>
    </li>
  )
}
