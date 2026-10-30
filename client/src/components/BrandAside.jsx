import { Link } from 'react-router'
import Logo from './Logo.jsx'

// The narrow brand column on the left of the app's pages, on wide screens only
// (1024px and up): the logo at the top, a short line, a quiet echo of the
// logo's stacked slabs, and the name at the bottom. Deliberately understated:
// the jobs are the point. Screen readers skip the decoration; the words are
// plain text.
//
// It runs the full height of the screen and stays put while the page scrolls
// (sticky, h-dvh), whatever the length of the page beside it.
export default function BrandAside() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col self-start overflow-hidden border-r border-line/70 bg-linear-to-b from-surface to-bg px-8 pb-10 lg:flex">
      {/* The same height as the header beside it (AppHeader.jsx), so the logo
          lines up with Overview, My Stash and Add Job. */}
      <div className="relative z-10 flex h-17 shrink-0 items-center">
        <Link to="/stash" aria-label="JobStash, go to My Stash">
          <Logo className="text-[1.75rem]" />
        </Link>
      </div>

      <div className="relative z-10 mt-46">
        <p className="text-xl leading-snug font-bold tracking-tight text-ink">
          Save today.
          <br />
          Apply tomorrow.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          A simple place to keep opportunities that matter to you.
        </p>
      </div>

      <LayeredSlabs />

      <div className="relative z-10 mt-auto">
        <div className="mb-3 h-px w-8 bg-line" aria-hidden="true" />
        <p className="text-sm font-semibold text-ink">JobStash</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Your future opportunities, organized.
        </p>
      </div>
    </aside>
  )
}

// Three slanted, rounded slabs stacked like the ones in the logo mark, in very
// pale blues, bleeding off the column's left edge.
function LayeredSlabs() {
  return (
    <svg
      className="pointer-events-none absolute top-1/2 -left-16 w-72 -translate-y-1/3"
      viewBox="0 0 280 320"
      fill="none"
      aria-hidden="true"
    >
      <g transform="skewY(22)">
        <rect x="40" y="10" width="200" height="90" rx="28" fill="#EFF6FF" />
        <rect x="20" y="70" width="200" height="90" rx="28" fill="#DBEAFE" opacity="0.85" />
        <rect x="0" y="130" width="200" height="90" rx="28" fill="#BFDBFE" opacity="0.6" />
      </g>
    </svg>
  )
}
