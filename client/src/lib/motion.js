import { flushSync } from 'react-dom'

// Smooth changes to the job list, using the browser's View Transitions.
//
//   smoothly(() => setTab('done'))
//
// The browser takes a picture of the page, the change is made, then each job
// card slides from where it was to where it is now. Cards that leave fade out
// and cards that arrive fade in (styles.css sets the timing). Without
// smoothly(), the same change just happens at once.
//
// Browsers without View Transitions, people who ask their device for less
// motion, and pages in a background tab get the change straight away, exactly
// as before.

// Each card that should move on its own carries data-transition-name (see
// JobCard.jsx). The names are only switched on while a transition runs: an
// element with a name becomes its own layer, which would otherwise hide the
// ⋮ menu behind the card below it.
function nameCards(on) {
  for (const element of document.querySelectorAll('[data-transition-name]')) {
    element.style.viewTransitionName = on ? element.dataset.transitionName : ''
  }
}

let latest = null

export function smoothly(update) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // A page in a background tab isn't being drawn, so the browser would hold
  // the change back until you look at it again. Nobody sees an animation
  // there anyway, so make the change straight away.
  if (!document.startViewTransition || reduceMotion || document.hidden) {
    update()
    return
  }

  // The change must happen exactly once, whichever of the two paths below
  // gets there first.
  let done = false
  function change() {
    if (done) return
    done = true
    // React normally updates the page a moment later. The browser needs the
    // new page right now, to compare it with the picture it took.
    flushSync(update)
  }

  nameCards(true)
  const transition = document.startViewTransition(() => {
    change()
    // Cards that just appeared need their names too.
    nameCards(true)
  })
  latest = transition

  // The browser makes the change on its next screen refresh. If that hasn't
  // happened within 0.3s (the window is minimised or covered, say), make the
  // change anyway and drop the animation, so a click is never lost.
  setTimeout(() => {
    if (done) return
    change()
    transition.skipTransition()
  }, 300)

  // When an animation is skipped (a quicker second change, or the tab is in
  // the background), the browser reports it as a failure on transition.ready.
  // The change itself has still happened, so there's nothing to do about it,
  // except not let it show up as an error.
  transition.ready.catch(() => {})

  // A quick second change cuts the first one short. Only the latest one
  // switches the names off, so it doesn't pull them away from the new one.
  transition.finished.finally(() => {
    if (latest === transition) nameCards(false)
  })
}
