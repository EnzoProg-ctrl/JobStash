import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import useSlider from '../lib/useSlider.js'
import AccountMenu from './AccountMenu.jsx'
import Logo from './Logo.jsx'
import UserAvatar from './UserAvatar.jsx'
import { signOut, useAuth } from '../lib/auth.jsx'

// The bar across the top of the app's pages. No divider line under it: the
// white fades into the page's own background instead (the strip below), so the
// bar and the page read as one surface. The fade ignores the mouse, so it never
// gets in the way of menus underneath.
//
// Phones: just the logo and the account ⋮; the bottom bar (BottomNav.jsx) has
// Overview, Add Job and My Stash. From 768px the bar is 80px tall: Overview and
// My Stash on the left, then Add Job, a circle with your initials and Sign out
// on the right. From 1024px the logo moves to the top of the brand column
// (BrandAside.jsx), which is the same 80px tall, so the two line up.
export default function AppHeader() {
  const { session } = useAuth()
  const [leaving, setLeaving] = useState(false)
  // The underline under Overview or My Stash, whichever page this is (NavLink
  // marks it aria-current="page"); it slides across when the page changes.
  const { pathname } = useLocation()
  const { row, marker } = useSlider('[aria-current="page"]', pathname)

  async function handleSignOut() {
    setLeaving(true)
    await signOut()
  }

  return (
    <header className="relative z-20 bg-surface">
      <div className="flex items-center justify-between gap-3 px-4 py-3 md:h-20 md:px-8 md:py-0 lg:pl-12">
        <div className="flex items-center gap-8 self-stretch">
          <Link to="/stash" aria-label="JobStash, go to My Stash" className="flex items-center lg:hidden">
            <Logo className="text-2xl md:text-[1.75rem]" />
          </Link>
          {/* Overview and My Stash run the full height of the bar, so the
              sliding underline sits on its bottom edge. */}
          <nav ref={row} className="relative hidden items-stretch gap-6 self-stretch md:flex lg:gap-10" aria-label="Main">
            <span
              ref={marker}
              aria-hidden="true"
              className="pointer-events-none absolute top-0 left-0 h-0.5 w-(--w) translate-x-(--x) translate-y-[calc(var(--y)+var(--h)-0.125rem)] rounded-full bg-brand-blue transition-[translate,width] duration-300 ease-out"
            />
            <PageLink to="/overview">Overview</PageLink>
            <PageLink to="/stash">My Stash</PageLink>
          </nav>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <Link
            to="/stash/add"
            className="press hidden h-12 items-center gap-2 rounded-lg bg-brand-blue px-5 font-semibold text-white hover:bg-brand-blue-dark md:inline-flex"
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
            <div className="hidden items-center gap-2 md:flex">
              <UserAvatar user={session.user} className="ml-1" />
              <button
                type="button"
                onClick={handleSignOut}
                disabled={leaving}
                className="min-h-11 rounded-lg px-2 font-medium text-ink hover:text-brand-blue disabled:opacity-60"
              >
                {leaving ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          )}
        </div>
      </div>
      {/* The fade from the bar's white into the page's background. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-full h-6 bg-linear-to-b from-surface to-bg"
      />
    </header>
  )
}

// Overview and My Stash: the current one is blue, with the sliding underline
// (in AppHeader) under it.
function PageLink({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `inline-flex items-center font-semibold transition-colors duration-300 ${
          isActive ? 'text-brand-blue' : 'text-muted hover:text-ink'
        }`
      }
    >
      {children}
    </NavLink>
  )
}

