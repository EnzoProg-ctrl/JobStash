import { useEffect, useRef, useState } from 'react'

// The ⋮ button on a job card and the small menu it opens.
//
// It closes when you pick something, press Esc, or click anywhere outside it.
// Esc also puts focus back on the ⋮ button, so keyboard users are not left
// stranded somewhere on the page.
export default function CardMenu({ label, status, onSetStatus }) {
  const [open, setOpen] = useState(false)
  const wrapper = useRef(null)
  const button = useRef(null)

  useEffect(() => {
    if (!open) return

    function handlePointer(event) {
      if (!wrapper.current.contains(event.target)) setOpen(false)
    }
    function handleKey(event) {
      if (event.key === 'Escape') {
        setOpen(false)
        button.current.focus()
      }
    }

    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const next = status === 'done' ? 'to_apply' : 'done'

  return (
    <div ref={wrapper} className="relative shrink-0">
      <button
        ref={button}
        type="button"
        aria-label={`More actions for ${label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className="flex size-11 items-center justify-center rounded-lg text-accent hover:bg-subtle hover:text-ink"
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
          aria-label={`Actions for ${label}`}
          className="absolute top-full right-0 z-10 mt-1 w-60 rounded-card border border-line bg-surface p-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            // Opening the menu moves focus into it, so Enter picks straight away.
            autoFocus
            onClick={() => {
              setOpen(false)
              onSetStatus(next)
            }}
            className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-semibold text-ink hover:bg-subtle"
          >
            {next === 'done' ? (
              <>
                <svg className="size-4 text-done" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Mark as done
              </>
            ) : (
              <>
                <svg className="size-4 text-todo" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8a5 5 0 105-5H5M5 3L3 5m2-2L3 1" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Move back to To Apply
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
