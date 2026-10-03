import { Link, NavLink } from 'react-router'

// The bar along the bottom of the screen on phones: My Stash, and a big round
// Add Job button that sticks up above the bar, where a thumb reaches it. On
// wider screens both live in the header instead (AppHeader.jsx).
//
// pb-[env(safe-area-inset-bottom)] keeps it clear of the iPhone's home swipe
// line (it needs viewport-fit=cover in index.html).
export default function BottomNav() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgb(15_23_42/0.06)] md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-2">
        <NavLink
          to="/stash"
          className={({ isActive }) =>
            `flex min-h-16 flex-col items-center justify-center gap-1 text-sm font-semibold ${
              isActive ? 'text-brand-blue' : 'text-muted hover:text-ink'
            }`
          }
        >
          <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" />
          </svg>
          My Stash
        </NavLink>

        <Link
          to="/stash/add"
          className="press group flex flex-col items-center justify-end gap-1 pb-2 text-sm font-semibold text-ink"
        >
          {/* Sticks up above the bar: -mt-7 lifts it, the ring of page
              colour around it makes it look cut out of the bar. */}
          <span className="-mt-7 flex size-14 items-center justify-center rounded-full bg-brand-blue text-white shadow-lg ring-4 ring-surface group-hover:bg-todo">
            <svg className="size-7" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M10 4v12M4 10h12" />
            </svg>
          </span>
          Add Job
        </Link>
      </div>
    </nav>
  )
}
