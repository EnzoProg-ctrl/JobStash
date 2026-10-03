import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { useMenu } from '../lib/useMenu.js'

// The ⋮ in the landing page header on phones. On wider screens "How it works"
// and "Features" sit in the header itself; a phone has no room for them next
// to the logo and the Sign in button, so they live in this menu instead.
//
// It closes when you pick something, press Esc, or tap anywhere outside it
// (lib/useMenu.js). The two section links glide down the page (styles.css).
const itemClass =
  'flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm font-semibold text-ink hover:bg-subtle'

export default function LandingMenu() {
  const { open, setOpen, wrapper, button } = useMenu()
  const close = () => setOpen(false)
  const firstItem = useRef(null)

  // Opening the menu moves focus into it, so Enter picks straight away.
  // (React's autoFocus only works on buttons and form fields, not links.)
  useEffect(() => {
    if (open) firstItem.current?.focus()
  }, [open])

  return (
    <div ref={wrapper} className="relative">
      <button
        ref={button}
        type="button"
        aria-label="Menu"
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
          aria-label="Menu"
          className="menu-in absolute top-full right-0 z-20 mt-2 w-52 origin-top-right rounded-card border border-line bg-surface p-1 shadow-lg"
        >
          <a ref={firstItem} href="#how-it-works" role="menuitem" onClick={close} className={itemClass}>
            How it works
          </a>
          <a href="#features" role="menuitem" onClick={close} className={itemClass}>
            Features
          </a>
          <div className="my-1 border-t border-line" />
          <Link to="/privacy" role="menuitem" onClick={close} className={itemClass}>
            Privacy
          </Link>
        </div>
      )}
    </div>
  )
}
