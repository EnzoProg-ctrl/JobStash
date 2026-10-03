import { useState } from 'react'
import { signOut } from '../lib/auth.jsx'
import { useMenu } from '../lib/useMenu.js'

// The ⋮ in the phone header: who is signed in, and Sign out. On wider screens
// Sign out is a button in the header itself (AppHeader.jsx), so this is only
// shown on phones.
export default function AccountMenu({ email }) {
  const { open, setOpen, wrapper, button } = useMenu()
  const [leaving, setLeaving] = useState(false)

  async function handleSignOut() {
    setLeaving(true)
    await signOut()
  }

  return (
    <div ref={wrapper} className="relative">
      <button
        ref={button}
        type="button"
        aria-label="Account"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className="flex size-11 items-center justify-center rounded-full bg-subtle text-ink hover:bg-line"
      >
        <svg className="size-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <circle cx="10" cy="4" r="1.75" />
          <circle cx="10" cy="10" r="1.75" />
          <circle cx="10" cy="16" r="1.75" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="menu-in absolute top-full right-0 z-20 mt-2 w-64 origin-top-right rounded-card border border-line bg-surface p-1 shadow-lg"
        >
          <p className="px-3 py-2 text-sm text-muted">
            Signed in as
            <span className="block font-semibold wrap-anywhere text-ink">{email}</span>
          </p>
          <div className="my-1 border-t border-line" />
          <button
            type="button"
            role="menuitem"
            // Opening the menu moves focus into it, so Enter picks straight away.
            autoFocus
            onClick={handleSignOut}
            disabled={leaving}
            className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-semibold text-ink hover:bg-subtle disabled:opacity-60"
          >
            <svg className="size-4 text-accent" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 14H3V2h3M10.5 11.5L14 8l-3.5-3.5M14 8H6" />
            </svg>
            {leaving ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  )
}
