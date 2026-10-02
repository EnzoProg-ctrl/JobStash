import { useState } from 'react'
import { Link } from 'react-router'
import Logo from './Logo.jsx'
import { signOut, useAuth } from '../lib/auth.jsx'

// The header on every app screen. The logo goes to My Stash, which is the
// app's home; the landing page at "/" is for visitors.
//
// Signed-in people also get Sign out here. Demo mode has no accounts, so it
// has no Sign out either. The design's account avatar is still left out.
export default function AppHeader() {
  const { session } = useAuth()
  const [leaving, setLeaving] = useState(false)

  async function handleSignOut() {
    setLeaving(true)
    await signOut()
  }

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-8">
        <Link to="/stash" aria-label="JobStash, go to My Stash">
          <Logo className="text-2xl md:text-3xl" />
        </Link>
        <div className="flex items-center gap-2 md:gap-3">
          <Link
            to="/stash/add"
            className="press inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-blue px-4 font-semibold text-white hover:bg-todo md:px-6"
          >
            <svg className="size-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M10 4v12M4 10h12" />
            </svg>
            Add Job
          </Link>
          {session && (
            <button
              type="button"
              onClick={handleSignOut}
              disabled={leaving}
              title={`Signed in as ${session.user.email}`}
              className="inline-flex min-h-11 items-center rounded-lg border border-line px-3 font-semibold text-ink hover:bg-subtle disabled:opacity-60 md:px-4"
            >
              {leaving ? 'Signing out…' : 'Sign out'}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
