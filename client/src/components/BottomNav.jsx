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
      className="bottom-nav fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgb(15_23_42/0.06)] md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-3">
        <NavLink
          to="/overview"
          className={({ isActive }) =>
            `flex min-h-16 flex-col items-center justify-center gap-1 text-sm font-semibold ${
              isActive ? 'text-brand-blue' : 'text-muted hover:text-ink'
            }`
          }
        >
          <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 20h16M7 16v-5M12 16V6M17 16v-8" />
          </svg>
          Overview
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
                <NavLink
          to="/stash"
          className={({ isActive }) =>
            `flex min-h-16 flex-col items-center justify-center gap-1 text-sm font-semibold ${
              isActive ? 'text-brand-blue' : 'text-muted hover:text-ink'
            }`
          }
        >
          <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
          </svg>
          My Stash
        </NavLink>
      </div>
    </nav>
  )
}
