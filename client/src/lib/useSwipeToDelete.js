import { useEffect, useRef, useState } from 'react'

// Swipe a job row to the left to delete it (My Stash list, on phones).
//
//   const swipe = useSwipeToDelete({ enabled, onDelete, onStart })
//   <li>{swipe.swiping && <RedLayer />}<div ref={swipe.ref}>…</div></li>
//
// The row follows the finger. Let go past 40% of its width, or with a quick
// flick, and it slides off to the left, then onDelete() runs (My Stash then
// removes it with an Undo message). Let go before that and it springs back.
//
// Touch only (fingers, and an Apple Pencil); a mouse doesn't swipe
// (computers delete from Select mode). Up-and-down still scrolls the page: a
// swipe only starts once the finger has clearly moved sideways. From then on
// the page is told not to scroll for that touch, because otherwise iPhone
// Safari takes the touch over at the first small up-or-down wobble and the
// row lets go halfway.
//
// While a finger moves, the row is moved directly (no React update per
// move), so it keeps up with the finger. The row's parent gets
// --swipe-progress (0 to 1 over the first 120px) for the bin behind it.
//
// swipe.swiping is true from the start of a swipe until the row is back in
// place (or gone). onStart() runs when a swipe starts, so the card can
// ignore the tap that may follow it.

const START_AFTER = 12 // px sideways before it counts as a swipe
const MOSTLY_SIDEWAYS = 1.5 // sideways must be this many times the up-or-down
const DELETE_PAST = 0.4 // of the row's width
const FLICK_SPEED = 0.6 // px per ms, to the left
const FLICK_MIN = 50 // px: a flick still has to move the row this far
const SLIDE_MS = 220
const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)'

export function useSwipeToDelete({ enabled, onDelete, onStart }) {
  const ref = useRef(null)
  const [swiping, setSwiping] = useState(false)
  // The latest props, for the listeners below (added once).
  const latest = useRef({ enabled, onDelete, onStart })
  latest.current = { enabled, onDelete, onStart }

  useEffect(() => {
    const row = ref.current
    if (!row) return undefined
    let touch = null // the finger being followed, or null
    let busy = false // sliding back or away after the finger lifted

    const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

    function place(x, animate) {
      row.style.transition = animate ? `transform ${SLIDE_MS}ms ${EASE}` : 'none'
      row.style.transform = `translateX(${x}px)`
      row.parentElement?.style.setProperty('--swipe-progress', String(Math.min(1, -x / 120)))
    }

    function reset() {
      row.style.transition = ''
      row.style.transform = ''
      row.parentElement?.style.removeProperty('--swipe-progress')
    }

    function onTouchStart(event) {
      // One finger only (two is a pinch), and not while a row is still
      // sliding, or from inside an open ⋮ menu or a text box.
      if (!latest.current.enabled || busy || event.touches.length !== 1) {
        touch = null
        return
      }
      if (event.target.closest('[role="menu"], input, textarea, select')) return
      const finger = event.touches[0]
      touch = {
        x: finger.clientX,
        y: finger.clientY,
        width: row.offsetWidth,
        sideways: null, // not decided yet
        dx: 0,
        lastX: finger.clientX,
        lastTime: event.timeStamp,
        speed: 0,
      }
    }

    function onTouchMove(event) {
      if (!touch) return
      if (event.touches.length !== 1) {
        cancel()
        return
      }
      const finger = event.touches[0]
      const dx = finger.clientX - touch.x
      const dy = finger.clientY - touch.y

      if (touch.sideways === null) {
        const across = Math.abs(dx)
        const down = Math.abs(dy)
        // Clearly up or down first: it's a scroll. Leave this touch alone.
        if (down > START_AFTER && down >= across) {
          touch = null
          return
        }
        // Not far enough yet to tell.
        if (across < START_AFTER || across < down * MOSTLY_SIDEWAYS) return
        // To the right: nothing to do.
        if (dx > 0) {
          touch = null
          return
        }
        touch.sideways = true
        // Start from where the finger is now, so the row doesn't jump.
        touch.x = finger.clientX
        setSwiping(true)
        latest.current.onStart?.()
      }

      // A swipe: the page mustn't scroll (and Safari mustn't take over).
      if (event.cancelable) event.preventDefault()
      const elapsed = event.timeStamp - touch.lastTime
      if (elapsed > 0) touch.speed = (finger.clientX - touch.lastX) / elapsed
      touch.lastX = finger.clientX
      touch.lastTime = event.timeStamp
      touch.dx = Math.min(0, finger.clientX - touch.x)
      place(touch.dx, false)
    }

    function onTouchEnd() {
      if (!touch) return
      const t = touch
      touch = null
      if (!t.sideways) return

      const moved = -t.dx
      const flicked = t.speed < -FLICK_SPEED && moved > FLICK_MIN
      const wait = reduceMotion() ? 0 : SLIDE_MS
      busy = true
      if (moved > t.width * DELETE_PAST || flicked) {
        place(-t.width, true)
        setTimeout(() => latest.current.onDelete(), wait)
      } else {
        place(0, true)
        setTimeout(() => {
          reset()
          busy = false
          setSwiping(false)
        }, wait)
      }
    }

    // The touch was taken away (a call came in, say): put the row back.
    function cancel() {
      if (!touch) return
      const t = touch
      touch = null
      if (!t.sideways) return
      busy = true
      place(0, true)
      setTimeout(() => {
        reset()
        busy = false
        setSwiping(false)
      }, reduceMotion() ? 0 : SLIDE_MS)
    }

    row.addEventListener('touchstart', onTouchStart, { passive: true })
    // Not passive: it has to be able to stop the page scrolling.
    row.addEventListener('touchmove', onTouchMove, { passive: false })
    row.addEventListener('touchend', onTouchEnd)
    row.addEventListener('touchcancel', cancel)
    return () => {
      row.removeEventListener('touchstart', onTouchStart)
      row.removeEventListener('touchmove', onTouchMove)
      row.removeEventListener('touchend', onTouchEnd)
      row.removeEventListener('touchcancel', cancel)
    }
  }, [])

  return { ref, swiping }
}
