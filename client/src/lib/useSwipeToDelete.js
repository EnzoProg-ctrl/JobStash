import { useRef, useState } from 'react'

// Swipe a job row to the left to delete it (My Stash list, on phones).
//
//   const swipe = useSwipeToDelete({ enabled, onDelete, onStart })
//   <div {...swipe.handlers} style={swipe.style}>…</div>
//
// The row follows the finger. Let go past 40% of its width, or with a quick
// flick, and it slides off to the left, then onDelete() runs (My Stash then
// removes it with an Undo message). Let go before that and it springs back.
//
// Only a finger or a pen swipes; a mouse doesn't (computers delete from
// Select mode). Up-and-down still scrolls the page: the swipe only starts
// once the finger has clearly moved sideways, more than up or down.
//
// swipe.swiping is true from the first sideways move until the row is back
// in place (or gone), so the card can show the red layer behind it only then.
// onStart() runs when a swipe starts, so the card can ignore the click that
// may follow it.

const START_AFTER = 8 // px moved before deciding: sideways swipe or scroll?
const DELETE_PAST = 0.4 // of the row's width
const FLICK_SPEED = 0.5 // px per ms, to the left
const FLICK_MIN = 40 // px: a flick still has to move the row this far
const SLIDE_MS = 220

export function useSwipeToDelete({ enabled, onDelete, onStart }) {
  const [offset, setOffset] = useState(0)
  // 'idle', 'dragging' (following the finger), 'back' (springing back) or
  // 'leaving' (sliding off before it's deleted).
  const [phase, setPhase] = useState('idle')
  const touch = useRef(null)

  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

  function springBack() {
    setPhase('back')
    setOffset(0)
    setTimeout(() => setPhase((now) => (now === 'back' ? 'idle' : now)), reduceMotion() ? 0 : SLIDE_MS)
  }

  function onPointerDown(event) {
    if (!enabled || event.pointerType === 'mouse' || phase !== 'idle') return
    // Not from inside an open ⋮ menu or a text box.
    if (event.target.closest('[role="menu"], input, textarea, select')) return
    touch.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      width: event.currentTarget.offsetWidth,
      sideways: null,
      lastX: event.clientX,
      lastTime: event.timeStamp,
      speed: 0,
    }
  }

  function onPointerMove(event) {
    const t = touch.current
    if (!t || event.pointerId !== t.id) return
    const dx = event.clientX - t.x
    const dy = event.clientY - t.y

    if (t.sideways === null) {
      if (Math.abs(dx) < START_AFTER && Math.abs(dy) < START_AFTER) return
      // Sideways and to the left: a swipe. Anything else: leave it be (the
      // page scrolls as usual).
      if (Math.abs(dx) > Math.abs(dy) && dx < 0) {
        t.sideways = true
        // Keep getting this finger's moves even outside the row. (If the
        // browser has already let go of that finger, carry on without.)
        try {
          event.currentTarget.setPointerCapture(event.pointerId)
        } catch {
          // Nothing to do.
        }
        setPhase('dragging')
        onStart?.()
      } else {
        touch.current = null
        return
      }
    }

    const elapsed = event.timeStamp - t.lastTime
    if (elapsed > 0) t.speed = (event.clientX - t.lastX) / elapsed
    t.lastX = event.clientX
    t.lastTime = event.timeStamp
    // Only to the left; past the start, it stays put.
    setOffset(Math.min(0, dx))
  }

  function onPointerUp(event) {
    const t = touch.current
    if (!t || event.pointerId !== t.id) return
    touch.current = null
    if (!t.sideways) return

    const moved = Math.max(0, t.x - event.clientX)
    const flicked = t.speed < -FLICK_SPEED && moved > FLICK_MIN
    if (moved > t.width * DELETE_PAST || flicked) {
      setPhase('leaving')
      setOffset(-t.width)
      setTimeout(() => onDelete(), reduceMotion() ? 0 : SLIDE_MS)
    } else {
      springBack()
    }
  }

  // The browser took the touch over (it started scrolling, say): put the
  // row back.
  function onPointerCancel(event) {
    const t = touch.current
    if (!t || event.pointerId !== t.id) return
    touch.current = null
    if (t.sideways) springBack()
  }

  const swiping = phase !== 'idle'
  return {
    swiping,
    // How far it's been swiped, from 0 to 1 over the first 120px: the bin
    // grows in over that distance.
    progress: swiping ? Math.min(1, -offset / 120) : 0,
    handlers: enabled ? { onPointerDown, onPointerMove, onPointerUp, onPointerCancel } : {},
    // No transform at all when still: a transform would put the row on a
    // layer of its own, and the ⋮ menu (which hangs below the row) under the
    // next row.
    style: swiping
      ? {
          transform: `translateX(${offset}px)`,
          transition: phase === 'dragging' ? 'none' : `transform ${SLIDE_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
        }
      : undefined,
  }
}
