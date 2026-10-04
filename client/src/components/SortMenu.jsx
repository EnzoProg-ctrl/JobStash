import { useEffect, useRef, useState } from 'react'
import { useMenu } from '../lib/useMenu.js'

// The sort button on My Stash ("⇅ Newest first ⌄") and the list it opens.
//
// It's our own dropdown instead of the browser's <select>, because the
// browser draws a <select>'s list itself and it can't be animated. Here:
//   - the list drops down and grows, and the options slide in one by one
//   - a soft highlight glides to whichever option the mouse or arrow keys are on
//   - the chosen option has a ✓ that draws itself
//   - the ⌄ turns over while the list is open, and the list folds up on close
//   - the ⇅ icon spins when the sort changes
//
// It works like a <select> for keyboards and screen readers: ↓ or ↑ on the
// button opens it, ↑ ↓ Home End move, Enter or Space picks, Esc closes, and
// typing a letter jumps to the option starting with it.

// Each option is h-11 (44px) tall; the gliding highlight moves in these steps.
const OPTION_HEIGHT = 44

export default function SortMenu({ value, options, onChange }) {
  const { open, setOpen, wrapper, button } = useMenu()
  const list = useRef(null)
  const icon = useRef(null)
  const [active, setActive] = useState(0)
  // The list stays in the page for a moment after closing, to fold up.
  const [folding, setFolding] = useState(false)
  const opened = useRef(false)
  // Set once a sort is picked here, so the label only rises in after a
  // change, not every time the page loads.
  const [picked, setPicked] = useState(false)
  // Opens upward when there isn't room below (low on a phone screen).
  const [up, setUp] = useState(false)

  const chosen = Math.max(0, options.findIndex((option) => option.value === value))

  useEffect(() => {
    if (open) {
      opened.current = true
      setActive(chosen)
      list.current?.focus({ preventScroll: true })
      return
    }
    // Nothing to fold before it has ever opened (when the page loads).
    if (!opened.current) return
    setFolding(true)
    const timer = setTimeout(() => setFolding(false), lessMotion() ? 0 : 150)
    return () => clearTimeout(timer)
    // Only when it opens or closes; `chosen` can't change while it's open.
  }, [open])

  function choose(index) {
    setOpen(false)
    button.current.focus()
    const option = options[index]
    if (option.value !== value) {
      flip(icon.current)
      setPicked(true)
      onChange(option.value)
    }
  }

  function handleButtonKey(event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      openList()
    }
  }

  function openList() {
    // Room below the button: down to the bottom bar on phones (BottomNav.jsx),
    // or the bottom of the window. 8px for the list's padding and gap.
    const bar = document.querySelector('.bottom-nav')?.getBoundingClientRect()
    const floor = bar?.height ? bar.top : window.innerHeight
    const box = button.current.getBoundingClientRect()
    const needed = options.length * OPTION_HEIGHT + 16
    setUp(floor - box.bottom < needed && box.top > floor - box.bottom)
    setOpen(true)
  }

  function handleListKey(event) {
    const last = options.length - 1
    const moves = { ArrowDown: Math.min(last, active + 1), ArrowUp: Math.max(0, active - 1), Home: 0, End: last }
    if (event.key in moves) {
      event.preventDefault()
      setActive(moves[event.key])
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      choose(active)
    } else if (event.key === 'Tab') {
      setOpen(false)
    } else if (event.key.length === 1) {
      // A letter: jump to the next option that starts with it.
      const letter = event.key.toLowerCase()
      const next = [...options.keys()]
        .map((step) => (active + 1 + step) % options.length)
        .find((index) => options[index].label.toLowerCase().startsWith(letter))
      if (next !== undefined) setActive(next)
    }
  }

  return (
    <div
      ref={wrapper}
      className="relative md:w-56"
      // Tabbing to something else on the page closes it. Only when focus
      // went somewhere: on phones (Safari especially) tapping a button doesn't
      // focus it, so tapping the sort button to close the list looked like
      // focus going nowhere; the list closed, then the tap reopened it.
      // Taps and clicks outside are handled by useMenu.
      onBlur={(event) => {
        const to = event.relatedTarget
        if (open && to && !wrapper.current.contains(to)) setOpen(false)
      }}
    >
      <button
        ref={button}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="sort-options"
        aria-label={`Sort jobs: ${options[chosen].label}`}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={handleButtonKey}
        className="relative flex min-h-11 w-full items-center rounded-card border border-transparent bg-transparent pr-8 pl-8 text-left text-base font-semibold whitespace-nowrap text-ink max-[359px]:pr-7 max-[359px]:pl-7 max-[359px]:text-sm md:min-h-12 md:border-line md:bg-surface md:pr-10 md:pl-12 md:hover:bg-subtle"
      >
        <svg ref={icon} className="pointer-events-none absolute top-1/2 left-1 size-5 -translate-y-1/2 text-ink md:left-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 3v14M3 14l3 3 3-3M14 17V3M11 6l3-3 3 3" />
        </svg>
        {/* key: the label fades in again whenever it changes. */}
        <span key={value} className={picked ? 'sort-label-in' : undefined}>{options[chosen].label}</span>
        <svg
          className={`pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-ink transition-transform duration-200 md:right-4 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {(open || folding) && (
        <ul
          ref={list}
          id="sort-options"
          role="listbox"
          aria-label="Sort jobs"
          aria-activedescendant={open ? `sort-option-${options[active].value}` : undefined}
          tabIndex={-1}
          onKeyDown={handleListKey}
          className={`absolute left-0 z-20 w-max min-w-full rounded-card ${
            up ? 'bottom-full mb-1 origin-bottom [--sort-shift:6px]' : 'top-full mt-1 origin-top'
          } border border-line bg-surface p-1 shadow-lg outline-none ${
            open ? 'sort-menu-in' : 'sort-menu-out pointer-events-none'
          }`}
        >
          {/* The highlight behind the options. It glides from one to the next. */}
          <li
            role="presentation"
            className="absolute inset-x-1 top-1 h-11 rounded-lg bg-subtle transition-transform duration-150 ease-out"
            style={{ transform: `translateY(${active * OPTION_HEIGHT}px)` }}
          />
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`sort-option-${option.value}`}
              role="option"
              aria-selected={index === chosen}
              onMouseEnter={() => setActive(index)}
              onClick={() => choose(index)}
              style={{ animationDelay: `${40 + index * 40}ms` }}
              className={`sort-option-in relative flex h-11 cursor-pointer items-center gap-2 rounded-lg pr-4 pl-3 text-sm ${
                index === chosen ? 'font-semibold text-brand-blue' : 'text-ink'
              }`}
            >
              <svg className="size-4 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                {index === chosen && (
                  <path className="sort-check-draw" d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                )}
              </svg>
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function lessMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// A small "got it" when the sort changes: the ⇅ icon spins half a turn,
// grows a little and turns blue, then settles. ⇅ looks the same upside down,
// so it ends exactly as it started.
function flip(icon) {
  if (!icon?.animate || lessMotion()) return
  const blue = getComputedStyle(document.documentElement).getPropertyValue('--color-brand-blue')
  icon.animate(
    [
      { transform: 'rotate(0deg) scale(1)' },
      { transform: 'rotate(110deg) scale(1.25)', color: blue, offset: 0.45 },
      { transform: 'rotate(180deg) scale(1)' },
    ],
    { duration: 350, easing: 'cubic-bezier(0.34, 1.4, 0.64, 1)' },
  )
}
