import { useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'

// Light or dark theme.
//
//   const theme = useTheme()     // 'light' or 'dark', updates when it changes
//   setTheme('dark')             // switch, and remember the choice
//
// Until someone picks one, JobStash follows the device (its dark mode
// setting), and keeps following it if that changes. Once they pick, the
// choice is kept in this browser (localStorage) and wins over the device.
//
// The theme is the data-theme attribute on <html>; styles.css swaps the
// colour tokens for it. index.html sets it before the page first paints, so
// a dark device never flashes white; this file takes over from there.

const KEY = 'jobstash:theme'
const DARK_DEVICE = '(prefers-color-scheme: dark)'
// The browser's own bar colour (Android Chrome and others), per theme.
const BAR_COLOUR = { light: '#0F2D5B', dark: '#0B1120' }

const listeners = new Set()

function savedChoice() {
  try {
    const value = localStorage.getItem(KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    // Storage can be blocked (private windows, strict settings).
    return null
  }
}

function deviceTheme() {
  return window.matchMedia(DARK_DEVICE).matches ? 'dark' : 'light'
}

export function getTheme() {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

function apply(theme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BAR_COLOUR[theme])
  for (const listener of listeners) listener()
}

export function setTheme(theme) {
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // Not remembered, but still switched for this visit.
  }
  apply(theme)
}

// The toggle (ThemeToggle.jsx, LandingMenu.jsx): switch to the other theme,
// with the new one spreading out in a growing circle from `from` (the
// element that was clicked).
//
// It uses the browser's View Transitions: a picture of the page as it was
// stays put while the page in its new colours is uncovered by the circle
// (styles.css, :root.switching-theme). Browsers without View Transitions,
// people who ask for less motion, and pages in a background tab switch at
// once. Like lib/motion.js, if the browser hasn't made the change within
// 0.3s, it's made anyway and the animation dropped, so a click is never lost.
export function switchTheme(from) {
  const next = getTheme() === 'dark' ? 'light' : 'dark'
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!document.startViewTransition || reduceMotion || document.hidden) {
    setTheme(next)
    return
  }

  // Where the circle starts (the middle of what was clicked), and how big it
  // must grow to reach the farthest corner of the screen.
  const box = from?.getBoundingClientRect()
  const x = box ? box.left + box.width / 2 : window.innerWidth - 40
  const y = box ? box.top + box.height / 2 : 40
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
  const root = document.documentElement
  root.style.setProperty('--theme-x', `${x}px`)
  root.style.setProperty('--theme-y', `${y}px`)
  root.style.setProperty('--theme-r', `${Math.ceil(radius)}px`)
  root.classList.add('switching-theme')

  let done = false
  function change() {
    if (done) return
    done = true
    // React redraws the toggle's icon right now, not a moment later, so the
    // picture of the new page already shows it.
    flushSync(() => setTheme(next))
  }
  const transition = document.startViewTransition(change)
  latestSwitch = transition
  setTimeout(() => {
    if (done) return
    change()
    transition.skipTransition()
  }, 300)
  transition.ready.catch(() => {})
  // A quick second click cuts this one short; only the latest one tidies up.
  transition.finished.finally(() => {
    if (latestSwitch === transition) root.classList.remove('switching-theme')
  })
}
let latestSwitch = null

export function useTheme() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getTheme,
  )
}

// Start-up: the same choice index.html made (in case its script didn't
// run), and follow the device's setting for as long as nothing is chosen.
apply(savedChoice() ?? deviceTheme())
window.matchMedia(DARK_DEVICE).addEventListener('change', () => {
  if (!savedChoice()) apply(deviceTheme())
})
