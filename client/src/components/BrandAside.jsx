import { Link } from 'react-router'
import Logo from './Logo.jsx'
import sidebarArt from '../assets/branding/jobstash-sidebar-art.svg'

// The brand column on the left of the app's pages, on wide screens only (1024px
// and up): the logo at the top, the slogan, the stacked ribbons artwork
// (assets/branding/jobstash-sidebar-art.svg) and the name at the bottom. It
// widens with the screen, to about 335px at 1536px, so smaller laptops keep
// their room for the jobs. Screen readers skip the artwork; the words are
// plain text.
//
// It runs the full height of the screen and stays put while the page scrolls
// (sticky, h-dvh), whatever the length of the page beside it.
export default function BrandAside() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col self-start overflow-hidden border-r border-line/70 bg-linear-to-b from-surface to-bg px-8 pb-10 lg:flex xl:w-72 2xl:w-84 2xl:pr-8 2xl:pl-12 2xl:pb-15">
      {/* The same height as the header beside it (AppHeader.jsx), so the logo
          lines up with Overview, My Stash and Add Job. */}
      <div className="relative z-10 flex h-20 shrink-0 items-center border-b border-line pb-3">
        <Link to="/stash" aria-label="JobStash, go to My Stash">
          <Logo className="text-[1.75rem] 2xl:text-[1.875rem]" />
        </Link>
      </div>

      {/* The gap above the slogan grows with the screen's height, so short
          screens still have room for the artwork. */}
      <div className="relative z-10 mt-[min(10rem,15vh)]">
        <p className="text-2xl leading-tight font-bold tracking-tight text-ink xl:text-[1.75rem] 2xl:text-[2rem]">
          Save today.
          <br />
          <span className="text-brand-blue">Apply tomorrow.</span>
        </p>
        <p className="mt-4 max-w-64 text-sm leading-relaxed text-muted xl:text-base 2xl:text-lg">
          A simple place to keep opportunities that matter to you.
        </p>
      </div>

      {/* The artwork fills the space between the slogan and the name at the
          bottom: as tall as that space (up to 28rem), wider than the column,
          and cut off at both sides on purpose. It never covers the words. */}
      <div className="relative my-6 min-h-0 flex-1" aria-hidden="true">
        <img
          src={sidebarArt}
          alt=""
          className="pointer-events-none absolute top-1/2 -left-8 h-[min(100%,28rem)] w-auto max-w-none -translate-y-1/2 select-none"
          draggable="false"
        />
      </div>

      <div className="relative z-10 shrink-0">
        <div className="mb-3 h-px w-8 bg-line" aria-hidden="true" />
        <p className="text-sm font-semibold text-ink 2xl:text-lg">JobStash</p>
        <p className="mt-1 text-xs leading-relaxed text-muted 2xl:text-base">
          Your future opportunities, organized.
        </p>
      </div>
    </aside>
  )
}
