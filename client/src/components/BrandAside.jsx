import { Link } from 'react-router'
import Logo from './Logo.jsx'
import sidebarArt from '../assets/branding/jobstash-sidebar-art.svg'

// The brand column on the left of the app's pages, on wide screens only (1024px
// and up): the logo at the top, the slogan, and right under it the stacked
// tiles artwork (assets/branding/jobstash-sidebar-art.svg), cut off by the
// column's right and bottom edges. Drawn to match the design reference
// (assets/jobstash-sidebar-reference.png). It widens with the screen, to about
// 335px at 1536px, so smaller laptops keep their room for the jobs. Screen
// readers skip the artwork; the words are plain text.
//
// It runs the full height of the screen and stays put while the page scrolls
// (sticky, h-dvh), whatever the length of the page beside it.
export default function BrandAside() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col self-start overflow-hidden bg-[linear-gradient(165deg,#F6F9FE_0%,#F1F6FE_40%,#EDF4FE_70%,#F2F7FE_100%)] px-8 lg:flex xl:w-72 2xl:w-84 2xl:pr-8 2xl:pl-12">
      {/* The same height as the header beside it (AppHeader.jsx), so the logo
          lines up with Overview, My Stash and Add Job. */}
      <div className="relative z-10 flex h-20 shrink-0 items-center border-b border-line pb-3">
        <Link to="/stash" aria-label="JobStash, go to My Stash">
          <Logo className="text-[1.75rem] 2xl:text-[1.875rem]" />
        </Link>
      </div>

      {/* The gap above the slogan grows with the screen's height. */}
      <div className="relative z-10 mt-[min(6rem,9vh)]">
        <p className="text-2xl leading-tight font-bold tracking-tight text-ink 2xl:text-[1.625rem]">
          Save today.
          <br />
          <span className="text-logo-blue">Apply tomorrow.</span>
        </p>
        <p className="mt-4 max-w-[190px] text-[0.9375rem] leading-[1.45] text-muted 2xl:max-w-54 2xl:text-base">
          A simple place to keep opportunities that matter to you.
        </p>
      </div>

      {/* The artwork, right under the words as in the reference: the full
          width of the column (the negative margins undo its padding), cut
          off by its right edge, and by its bottom edge however tall the
          screen is (the faint floor runs on down). */}
      <img
        src={sidebarArt}
        alt=""
        aria-hidden="true"
        draggable="false"
        className="pointer-events-none mt-3 -mr-8 -ml-8 w-[calc(100%+4rem)] max-w-none shrink-0 select-none 2xl:-ml-12 2xl:w-[calc(100%+5rem)]"
      />

      {/* Where the column meets the dashboard: no line at all. Its last
          48px shade into what's beside them: the dashboard's background
          (artwork included), and at the top the white header bar, which
          fades into the background over its last 24px (AppHeader.jsx) just
          as this does. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-linear-to-r from-transparent to-bg"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-0 h-26 w-12 bg-linear-to-r from-transparent to-surface mask-[linear-gradient(to_bottom,black_5rem,transparent)]"
      />
    </aside>
  )
}
