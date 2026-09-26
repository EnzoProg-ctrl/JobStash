import { useState } from 'react'
import { USING_MOCK_API } from '../api'

// Shown only while the simulated backend is switched on. It disappears by
// itself the moment you set VITE_USE_MOCK_API=false, because it reads the same
// variable the API layer does.
//
// Leave this in. A deployment that quietly pretends to have a server is the
// difference between a deliberate staging site and a submission hoping nobody
// checks. The × hides it for this visit only (sessionStorage), so it is back
// the next time someone opens the site.

const KEY = 'jobstash:demo-notice-hidden'

function readHidden() {
  try {
    return sessionStorage.getItem(KEY) === 'yes'
  } catch {
    // Storage can be blocked (private windows, strict settings). Show it.
    return false
  }
}

export default function DemoNotice({ className = '' }) {
  const [hidden, setHidden] = useState(readHidden)

  if (!USING_MOCK_API || hidden) return null

  function hide() {
    setHidden(true)
    try {
      sessionStorage.setItem(KEY, 'yes')
    } catch {
      // Hidden until the page reloads, which is fine.
    }
  }

  return (
    <div
      className={`flex items-start gap-3 rounded-card border border-line bg-todo-bg p-4 text-sm ${className}`}
      role="status"
    >
      <svg className="mt-0.5 size-5 shrink-0 text-brand-blue" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
        <circle cx="10" cy="10" r="8" />
        <path d="M10 9v5M10 6.25v.01" strokeLinecap="round" />
      </svg>
      <p className="flex-1">
        <strong className="block text-ink">Demo mode</strong>
        <span className="text-muted">
          Your jobs are saved in this browser only. There is no server or
          database behind this page.
        </span>
      </p>
      <button
        type="button"
        onClick={hide}
        aria-label="Hide the demo mode notice"
        className="-m-2 flex size-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-white hover:text-ink"
      >
        <svg className="size-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </button>
    </div>
  )
}
