import { useEffect, useLayoutEffect, useRef } from 'react'

// A marker (an underline, or a box behind a button) that sits on the chosen
// item in a row and slides to the next one when the choice changes. Used by
// Overview | My Stash (AppHeader.jsx) and To Apply | Done | All
// (FilterTabs.jsx).
//
// Put `row` on the row and `marker` on the marker. The chosen item is the one
// matching `selector` (e.g. '[aria-pressed="true"]'). The marker gets its
// place as CSS variables, --x, --y, --w and --h (in px), which its classes
// use; its CSS transition does the sliding. `chosen` is anything that
// changes when the choice changes, so the marker moves then.
//
// The first time, and when the row changes size (fonts loading, a count
// growing, the window resizing), the marker jumps into place without sliding,
// so it only slides when someone picks another item.
//
// slideFrom (optional): a screen width, e.g. '48rem'. Narrower than that the
// marker doesn't slide; it fades and grows in on the new item instead. On
// phones the items sit close together, and a sliding box sweeping across the
// item in between looked like it covered it for a moment.
export default function useSlider(selector, chosen, { slideFrom } = {}) {
  const row = useRef(null)
  const marker = useRef(null)

  // A new choice: slide there (or jump, the very first time).
  useLayoutEffect(() => {
    const markerElement = marker.current
    const placedBefore = markerElement?.style.getPropertyValue('--w')
    if (!placedBefore) {
      placeWithoutSliding(row.current, markerElement, selector)
    } else if (!slideFrom || window.matchMedia(`(width >= ${slideFrom})`).matches) {
      place(row.current, markerElement, selector)
    } else {
      placeWithoutSliding(row.current, markerElement, selector)
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        markerElement.animate(
          [{ opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1 }],
          { duration: 200, easing: 'ease-out' },
        )
      }
    }
  }, [selector, chosen, slideFrom])

  // The row changing size: jump. One watcher for as long as the row is there.
  useEffect(() => {
    const rowElement = row.current
    if (!rowElement) return
    const watcher = new ResizeObserver(() => placeWithoutSliding(rowElement, marker.current, selector))
    watcher.observe(rowElement)
    // The items, but not the marker: its own size changes while it slides.
    for (const item of rowElement.children) {
      if (item !== marker.current) watcher.observe(item)
    }
    return () => watcher.disconnect()
  }, [selector])

  return { row, marker }
}

function place(rowElement, markerElement, selector) {
  if (!rowElement || !markerElement) return
  const item = rowElement.querySelector(selector)
  // Nothing chosen, or the items are hidden at this screen size.
  if (!item || item.offsetWidth === 0) {
    markerElement.style.opacity = '0'
    return
  }
  markerElement.style.opacity = ''
  markerElement.style.setProperty('--x', `${item.offsetLeft}px`)
  markerElement.style.setProperty('--y', `${item.offsetTop}px`)
  markerElement.style.setProperty('--w', `${item.offsetWidth}px`)
  markerElement.style.setProperty('--h', `${item.offsetHeight}px`)
}

function placeWithoutSliding(rowElement, markerElement, selector) {
  if (!markerElement) return
  markerElement.style.transition = 'none'
  place(rowElement, markerElement, selector)
  markerElement.getBoundingClientRect() // apply the new place now, unanimated
  markerElement.style.transition = ''
}
