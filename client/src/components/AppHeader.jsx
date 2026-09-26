import { Link } from 'react-router'
import Logo from './Logo.jsx'

// The header on every app screen. The logo goes to My Stash, which is the
// app's home; the landing page at "/" is for visitors.
//
// The design also has an account avatar on the right. It is left out until
// sign-in exists, because there is no account for it to belong to yet.
export default function AppHeader() {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-8">
        <Link to="/stash" aria-label="JobStash, go to My Stash">
          <Logo className="text-2xl md:text-3xl" />
        </Link>
        <Link
          to="/add"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-blue px-4 font-semibold text-white hover:bg-todo md:px-6"
        >
          <svg className="size-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M10 4v12M4 10h12" />
          </svg>
          Add Job
        </Link>
      </div>
    </header>
  )
}
