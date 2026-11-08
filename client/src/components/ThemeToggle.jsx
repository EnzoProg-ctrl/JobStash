import { useId } from 'react'
import { switchTheme, useTheme } from '../lib/theme.js'

// The light / dark switch: a round button showing the theme you're in (a sun
// in light, a moon in dark). Clicking it turns the sun into the moon (or
// back) and the new theme spreads out from the button in a growing circle
// (switchTheme in lib/theme.js; the motion is in styles.css).
export default function ThemeToggle({ className = '' }) {
  const theme = useTheme()
  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <button
      type="button"
      onClick={(event) => switchTheme(event.currentTarget)}
      aria-label={label}
      title={label}
      className={`flex size-11 shrink-0 items-center justify-center rounded-full text-ink hover:bg-subtle ${className}`}
    >
      <ThemeIcon className="size-5" />
    </button>
  )
}

// Sun in light, moon in dark, and the change between them. Also used by the
// landing page's ⋮ menu (LandingMenu.jsx).
export function ThemeIcon({ className = '' }) {
  // Each icon needs its own mask name, as there can be two on a page.
  const mask = `theme-cut-${useId().replace(/:/g, '')}`

  return (
    <svg className={`theme-icon ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <mask id={mask}>
        <rect width="24" height="24" fill="white" />
        {/* Slides over the full circle to leave a crescent (dark theme). */}
        <circle className="theme-cut" cx="17" cy="7" r="6.5" fill="black" />
      </mask>
      <circle className="theme-core" cx="12" cy="12" r="8" fill="currentColor" mask={`url(#${mask})`} />
      <g className="theme-rays" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 1.5v2M12 20.5v2M1.5 12h2M20.5 12h2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M4.6 19.4L6 18M18 6l1.4-1.4" />
      </g>
    </svg>
  )
}
