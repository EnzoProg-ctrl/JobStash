import { useState } from 'react'
import { Link, NavLink } from 'react-router'
import AccountMenu from './AccountMenu.jsx'
import Logo from './Logo.jsx'
import { signOut, useAuth } from '../lib/auth.jsx'

// The bar across the top of the app's pages. No divider line under it: the
// white fades into the page's own background instead (the strip below), so the
// bar and the page read as one surface. The fade ignores the mouse, so it never
// gets in the way of menus underneath.
//
// Phones: just the logo and the account ⋮; the bottom bar (BottomNav.jsx) has
// Overview, Add Job and My Stash. From 768px: all of it up here.
export default function AppHeader() {
  const { session } = useAuth()
  const [leaving, setLeaving] = useState(false)

  async function handleSignOut() {
    setLeaving(true)
    await signOut()
  }

  return (
    <header className="relative z-20 bg-surface">
      <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-8">
        <Link to="/stash" aria-label="JobStash, go to My Stash">
          <Logo className="text-2xl md:text-[1.75rem]" />
        </Link>
        <nav className="flex items-center gap-2 md:gap-3" aria-label="Main">
          <PageLink to="/overview">Overview</PageLink>
          <PageLink to="/stash">My Stash</PageLink>

          <Link
            to="/stash/add"
            className="press ml-2 hidden min-h-11 items-center gap-2 rounded-lg bg-brand-blue px-5 font-semibold text-white hover:bg-brand-blue-dark md:inline-flex"
          >
            <svg className="size-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M10 4v12M4 10h12" />
            </svg>
            Add Job
          </Link>
          {session && (
            <div className="md:hidden">
              <AccountMenu email={session.user.email} />
            </div>
          )}
          {session && (
            <button
              type="button"
              onClick={handleSignOut}
              disabled={leaving}
              title={`Signed in as ${session.user.email}`}
              className="hidden min-h-11 items-center rounded-lg border border-line bg-surface px-4 font-semibold text-ink hover:bg-subtle disabled:opacity-60 md:inline-flex"
            >
              {leaving ? 'Signing out…' : 'Sign out'}
            </button>
          )}
        </nav>
      </div>
      {/* The fade from the bar's white into the page's background. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-full h-6 bg-linear-to-b from-surface to-bg"
      />
    </header>
  )
}

// Overview and My Stash: the current one is blue, with a short underline.
function PageLink({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative hidden min-h-11 items-center px-3 font-semibold md:inline-flex ${
          isActive
            ? 'text-brand-blue after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:rounded-full after:bg-brand-blue'
            : 'text-muted hover:text-ink'
        }`
      }
    >
      {children}
    </NavLink>
  )
}
