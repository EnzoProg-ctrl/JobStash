import { useEffect, useState } from 'react'

// The small dark message at the bottom after deleting a job:
//   Deleted "Frontend Intern"            Undo
//
// It only shows the message and the Undo button. StashPage decides when it
// appears and what Undo does.
//
// onHold(true) while the mouse is over it or keyboard focus is on its Undo
// button, onHold(false) when neither is any more, so StashPage can pause its
// countdown while someone is reaching for Undo.
export default function UndoToast({ message, onUndo, onHold }) {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const holding = hovered || focused

  useEffect(() => {
    onHold?.(holding)
    // Only when holding changes; onHold is a new function on every render.
  }, [holding])

  return (
    <div
      role="status"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className="menu-in fixed inset-x-0 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-20
      mx-auto flex w-[calc(100%-2rem)] max-w-md items-center justify-between gap-4 rounded-card bg-ink px-4 py-3 text-white shadow-lg md:bottom-6"
    >
      <p className="min-w-0 truncate text-sm">{message}</p>
      <button
        type="button"
        onClick={onUndo}
        className="min-h-11 shrink-0 rounded-lg px-3 font-semibold text-sky-300 hover:bg-white/10"
      >
        Undo
      </button>
    </div>
  )
}
