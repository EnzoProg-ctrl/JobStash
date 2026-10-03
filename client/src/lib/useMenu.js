import { useEffect, useRef, useState } from 'react'

// Open-and-close behaviour for a small menu behind a button (the ⋮ on a job
// card, the ⋮ in the phone header).
//
//   const { open, setOpen, wrapper, button } = useMenu()
//   <div ref={wrapper}> <button ref={button} …> {open && <div role="menu">…} </div>
//
// It closes when you press Esc or click anywhere outside it. Esc also puts
// focus back on the button, so keyboard users are not left stranded somewhere
// on the page.
export function useMenu() {
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

  return { open, setOpen, wrapper, button }
}
