import { Link } from 'react-router'
import Logo from './Logo.jsx'
import sidebarArt from '../assets/branding/jobstash-sidebar-art.svg'
import tilesArt from '../assets/branding/jobstash-tiles.svg'

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
    // The dark theme has its own gradient: navy, a step bluer than the page.
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col self-start overflow-hidden bg-[linear-gradient(165deg,#F6F9FE_0%,#F1F6FE_40%,#EDF4FE_70%,#F2F7FE_100%)] px-8 lg:flex xl:w-72 2xl:w-84 2xl:pr-8 2xl:pl-12 dark:bg-[linear-gradient(165deg,#0F1A30_0%,#0E182C_40%,#101C34_70%,#0D1628_100%)]">
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
          {/* The same slogan as the landing page and its footer. */}
          Stash it.
          <br />
          <span className="text-logo-blue">Apply later.</span>
        </p>
        <p className="mt-4 max-w-[190px] text-[0.9375rem] leading-[1.45] text-ink/70 2xl:max-w-54 2xl:text-base">
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
        className="pointer-events-none mt-3 -mr-8 -ml-8 w-[calc(100%+4rem)] max-w-none shrink-0 select-none 2xl:-ml-12 2xl:w-[calc(100%+5rem)] dark:hidden"
      />
      {/* Dark theme: that artwork's pale floor would show as a light block on
          navy, so the tiles alone (as on the landing page), softened. Same
          size and place as above: both pictures come from one drawing, and
          this one starts 25 units right and 21 down of it and is 250 wide
          (the other 244), so its width, left and top are the light one's
          scaled by those numbers (W below is the light picture's width). */}
      <img
        src={tilesArt}
        alt=""
        aria-hidden="true"
        draggable="false"
        className="pointer-events-none mt-[calc(0.75rem_+_(100%_+_4rem)_*_21_/_244)] ml-[calc(-2rem_+_(100%_+_4rem)_*_25_/_244)] hidden w-[calc((100%_+_4rem)_*_250_/_244)] max-w-none shrink-0 opacity-55 select-none 2xl:mt-[calc(0.75rem_+_(100%_+_5rem)_*_21_/_244)] 2xl:ml-[calc(-3rem_+_(100%_+_5rem)_*_25_/_244)] 2xl:w-[calc((100%_+_5rem)_*_250_/_244)] dark:block"
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
        className="pointer-events-none absolute top-0 right-0 h-26 w-12 bg-linear-to-r from-transparent to-surface dark:to-bg mask-[linear-gradient(to_bottom,black_5rem,transparent)]"
      />
    </aside>
  )
}
