import { useSyncExternalStore } from 'react'

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
