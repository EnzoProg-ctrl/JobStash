import { useRef } from 'react'

// Clicking or tapping a job card anywhere outside its own buttons and links.
// In Select mode it ticks the card; otherwise it opens the job posting in a
// new tab, just like the card's ↗ link. A job without a link does nothing.
//
//   const click = useCardClick({ url, selecting, onSelect })
//   <li onPointerDown={click.onPointerDown} onClick={click.onClick}>
//
// It leaves a click alone when:
//   - a menu (the ⋮) was open as you pressed: that press only closes the menu
//   - you were picking out text to copy
//   - the press turned into a drag on the board (call click.cancel())
//
// The ↗ link stays, so keyboards and screen readers still have a real link
// to the posting.
export function useCardClick({ url, selecting, onSelect }) {
  const skip = useRef(false)

  return {
    onPointerDown() {
      skip.current = Boolean(document.querySelector('[role="menu"]'))
    },
    onClick(event) {
      if (skip.current || event.defaultPrevented) return
      if (event.target.closest('a, button, input, label, [role="menu"]')) return
      if (selecting) {
        onSelect()
        return
      }
      if (window.getSelection()?.toString()) return
      if (url) window.open(url, '_blank', 'noopener,noreferrer')
    },
    cancel() {
      skip.current = true
    },
  }
}
