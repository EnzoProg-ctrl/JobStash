import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import DemoNotice from '../components/DemoNotice.jsx'
import GoogleButton, { googleButtonAvailable } from '../components/GoogleButton.jsx'
import LandingMenu from '../components/LandingMenu.jsx'
import Logo from '../components/Logo.jsx'
import Reveal from '../components/Reveal.jsx'
import StashPreview from '../components/StashPreview.jsx'
import UserAvatar from '../components/UserAvatar.jsx'
import { supabase } from '../lib/supabase.js'
import { clearSignInNote, readSignInNote, signOut, useAuth } from '../lib/auth.jsx'
import { usePageTitle } from '../lib/usePageTitle.js'
import tilesArt from '../assets/branding/jobstash-tiles.svg'

// The landing page. Its own header and footer, and full width, unlike the app
// screens that share AppLayout. It uses the dashboard's look (the same blue,
// the same initials circle and Sign out when signed in, and a live preview of
// My Stash), so going from here into the app feels like one place.

// How it works, in the order it happens. Step 2 is the link preview
// (server/linkPreview.js); jobs without a link (a referral, a cold email) can
// be typed in instead.
const STEPS = [
  {
    icon: LinkIcon,
    title: 'Paste the link',
    text: 'Found a job on LinkedIn, JobStreet or a company site? Paste its link into Add Job, on your phone or your computer.',
  },
  {
    icon: BoltIcon,
    title: 'The details fill themselves in',
    text: 'JobStash reads the posting for the company and the job title. No link, like a referral or a cold email? Just type them in.',
  },
  {
    icon: CheckIcon,
    title: "Apply when you're ready",
    text: 'Open My Stash later, apply, and mark it as applied. Then keep track of each answer: Pending, Accepted or Rejected.',
  },
]

// Each person only sees their own jobs: the API checks who is signed in and
// only returns that person's jobs (server/jobsRepo.js). In demo mode the jobs
// never leave the browser, so the promise holds there too.
const PROMISES = [
  {
    icon: CapIcon,
    title: 'Built for everyone',
    text: 'Nothing to set up and nothing to learn. If you can paste a link, you can use it.',
  },
  {
    icon: LockIcon,
    title: 'Your data stays private',
    text: "Only you can see your saved jobs. You sign in with Google, so there's no new password to remember.",
  },
  {
    icon: DevicesIcon,
    title: 'On any device',
    text: 'Save a job on your phone the moment you find it, then open the same list on your laptop to apply.',
  },
]

export default function HomePage() {
  const { session, demo } = useAuth()
  usePageTitle()

  return (
    <div className="min-h-screen overflow-x-clip">
      {/* 80px tall from 768px, like the dashboard's top bar (AppHeader.jsx). */}
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-5 min-[360px]:gap-4 md:h-20 md:px-8 md:py-0">
        <Link to="/" aria-label="JobStash home">
          {/* On the narrowest phones (under 360px) only the mark shows, so the
              mark, the button and the ⋮ menu fit on one line. The link's label
              still says "JobStash home" for screen readers. */}
          <Logo className="text-2xl md:text-[1.75rem]" wordClassName="max-[359px]:sr-only" />
        </Link>
        <nav className="flex items-center gap-2 md:gap-8" aria-label="Page sections">
          <a href="#how-it-works" className="hidden font-semibold text-muted hover:text-ink md:inline">How it works</a>
          <a href="#features" className="hidden font-semibold text-muted hover:text-ink md:inline">Features</a>
          {session ? (
            <span className="flex items-center gap-2 md:gap-4">
              <Link
                to="/stash"
                className="press inline-flex min-h-11 items-center rounded-lg bg-brand-blue px-3 font-semibold whitespace-nowrap text-white min-[360px]:px-4 hover:bg-brand-blue-dark md:h-12 md:px-5"
              >
                My Stash
              </Link>
              {/* Phones keep just the button and the ⋮ menu. */}
              <span className="hidden items-center gap-2 md:flex">
                <UserAvatar user={session.user} />
                <SignOutButton />
              </span>
            </span>
          ) : (
            <a
              href="#sign-in"
              className="press inline-flex min-h-11 items-center rounded-lg bg-brand-blue px-3 font-semibold whitespace-nowrap text-white min-[360px]:px-4 hover:bg-brand-blue-dark md:h-12 md:px-6"
            >
              {demo ? 'Try the demo' : 'Sign in'}
            </a>
          )}
          {/* Phones: How it works and Features don't fit beside the button, so
              they're in this ⋮ menu instead. */}
          <div className="md:hidden">
            <LandingMenu />
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 md:px-8">
        <DemoNotice className="mb-6" />

        {/* The headline, centred, with room around it. The ribbons from the
            dashboard's sidebar peek in from the right on wide screens. */}
        <section className="relative isolate pt-10 pb-14 text-center md:pt-20 md:pb-20">
          <img
            src={tilesArt}
            alt=""
            aria-hidden="true"
            draggable="false"
            className={`${DECORATION} absolute -top-6 -right-80 -z-10 hidden w-[26rem] opacity-40 xl:block`}
          />
          <img
            src={tilesArt}
            alt=""
            aria-hidden="true"
            draggable="false"
            className={`${DECORATION} absolute top-32 -left-56 -z-10 hidden w-[20rem] -scale-x-100 opacity-35 xl:block`}
          />
          <p className="inline-block rounded-full bg-todo-bg px-4 py-1.5 text-sm font-semibold text-brand-blue">
            A simpler way to job hunt
          </p>
          <h1 className="mx-auto mt-6 max-w-4xl text-[2.25rem] leading-[1.1] font-bold tracking-tight text-ink min-[400px]:text-[2.5rem] md:text-display lg:text-[4rem]">
            Found it on your phone?
            <span className="block text-brand-blue">Stash it. Apply later.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted md:text-xl">
            Save job postings, keep track of what to apply to, and stay one step
            closer to your future.
          </p>
          {/* Signing out from this page shows the "You've signed out" note:
              a new key starts the sign-in area afresh, so it reads the note. */}
          <SignIn key={session ? 'in' : 'out'} />
        </section>

        {/* What My Stash looks like, drawn by the app itself. */}
        <section className="pb-20 md:pb-28" aria-label="A look at My Stash">
          <Reveal className="mx-auto max-w-6xl">
            <StashPreview />
          </Reveal>
        </section>

        {/* How it works: a short heading, then the three steps side by side
            (stacked on phones), each arriving a moment after the one before. */}
        <section id="how-it-works" className="scroll-mt-8 border-t border-line py-20 md:py-28" aria-labelledby="how-it-works-title">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold tracking-wide text-brand-blue uppercase">How it works</p>
            <h2 id="how-it-works-title" className="mt-3 text-3xl leading-tight font-bold tracking-tight text-balance text-ink md:text-[2.5rem]">
              From a link to an application, in three steps.
            </h2>
          </Reveal>
          <ol className="mt-12 grid gap-5 md:mt-16 md:grid-cols-3 md:gap-8">
            {STEPS.map((step, index) => (
              <Reveal as="li" key={step.title} delay={index * 120} className="rounded-2xl border border-line bg-surface p-7 md:p-8">
                <div className="flex items-center justify-between">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-todo-bg text-brand-blue">
                    <step.icon />
                  </span>
                  <span className="text-sm font-semibold text-muted">Step {index + 1}</span>
                </div>
                <h3 className="mt-6 text-xl font-bold text-ink">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-pretty text-muted">{step.text}</p>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* Features: why JobStash on the left, the three promises on the
            right (stacked on phones and tablets). */}
        <section id="features" className="scroll-mt-8 border-t border-line py-20 md:py-28" aria-labelledby="features-title">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
            <Reveal className="lg:pt-6">
              <p className="text-sm font-semibold tracking-wide text-brand-blue uppercase">Why JobStash</p>
              <h2 id="features-title" className="mt-3 text-3xl leading-tight font-bold tracking-tight text-balance text-ink md:text-[2.5rem]">
                One calm place for every job you find.
              </h2>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
                Job hunting means open tabs, screenshots and notes everywhere. JobStash keeps
                them in one list, so no good opportunity slips away.
              </p>
            </Reveal>
            <ul className="divide-y divide-line border-y border-line">
              {PROMISES.map((item, index) => (
                <Reveal as="li" key={item.title} delay={index * 120} className="flex gap-5 py-7 md:py-8">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-todo-bg text-brand-blue">
                    <item.icon />
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-ink">{item.title}</h3>
                    <p className="mt-1.5 leading-relaxed text-pretty text-muted">{item.text}</p>
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* The page ends with a next step: sign in (back up at the top),
            the demo, or straight into My Stash when signed in. */}
        <Reveal
          as="section"
          className="relative isolate mb-20 overflow-hidden rounded-3xl bg-brand-blue px-6 py-14 text-center text-white md:mb-28 md:py-20"
          aria-labelledby="start-title"
        >
          <img
            src={tilesArt}
            alt=""
            aria-hidden="true"
            draggable="false"
            className={`${DECORATION} absolute -right-20 -bottom-28 -z-10 hidden w-96 opacity-25 md:block`}
          />
          <h2 id="start-title" className="mx-auto max-w-2xl text-3xl leading-tight font-bold tracking-tight text-balance md:text-[2.5rem]">
            {session ? 'Your stash is waiting.' : 'Your next job could be one link away.'}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-balance text-white/85">
            {session
              ? 'Pick up where you left off: apply to what you saved, and keep track of the answers.'
              : 'Start your stash in a few seconds, and never lose a job posting again.'}
          </p>
          {session || demo ? (
            <Link to="/stash" className={START_BUTTON}>
              {session ? 'Go to My Stash' : 'Try the demo'}
              <ArrowIcon />
            </Link>
          ) : (
            <a href="#sign-in" className={START_BUTTON}>
              Get started
              <ArrowIcon />
            </a>
          )}
        </Reveal>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between md:px-8">
          <div>
            <Logo className="text-2xl" />
            <p className="mt-2 text-sm text-muted">Stash today. A brighter tomorrow.</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-muted" aria-label="Footer">
            <a href="#how-it-works" className="inline-flex min-h-11 items-center hover:text-ink">How it works</a>
            <a href="#features" className="inline-flex min-h-11 items-center hover:text-ink">Features</a>
            <Link to="/privacy" className="inline-flex min-h-11 items-center hover:text-ink">Privacy</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}

// Sign in with Google, through Supabase Auth.
//
// Normally with Google's own button (GoogleButton.jsx): Google's window opens,
// you pick your account, and Supabase checks what Google sends back and signs
// you in, without leaving this page. Google's screen then names this site.
//
// If Google's button can't load, the old button is used instead: the browser
// leaves for Google, and Google sends it back to /stash with a one-time code,
// which the Supabase client (lib/supabase.js) swaps for a sign-in session by
// itself. That way Google's screen names Supabase's address.
//
// In demo mode there is no sign-in at all, so the same spot offers the demo.
// Someone already signed in gets a way straight into their stash instead.
//
// Centred under the headline, as wide as Google's button (400px at most).
// scroll-mt keeps the header's "Sign in" link from landing it at the very top
// edge of the screen.
const SIGN_IN_AREA = 'mx-auto mt-10 max-w-[400px] scroll-mt-24 text-center'

// The decorations use jobstash-tiles.svg: the sidebar's four tiles, whole and
// without its floor. (The sidebar's own file is cut off at its right and
// bottom on purpose, which shows as hard edges when it floats freely here.)
const DECORATION = 'pointer-events-none select-none'

// The white button in the blue band at the end of the page.
const START_BUTTON =
  'press mt-8 inline-flex min-h-14 items-center justify-center gap-2 rounded-lg bg-white px-8 text-lg font-semibold text-brand-blue hover:bg-todo-bg'

function SignIn() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState('idle')   // idle | leaving | checking | error
  const [error, setError] = useState(null)
  const [withGoogleButton, setWithGoogleButton] = useState(googleButtonAvailable)
  // Goes up after a failed sign-in, so Google's button is drawn afresh.
  const [attempt, setAttempt] = useState(0)
  // Set when a sign-in stopped working mid-use (api/httpApi.js). Read it
  // first, then clear it once the page is on screen, so it shows only once.
  const [note] = useState(readSignInNote)
  useEffect(clearSignInNote, [])

  if (!supabase) {
    return (
      <div id="sign-in" className={SIGN_IN_AREA}>
        <Link
          to="/stash"
          className="press inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-lg bg-brand-blue text-lg font-semibold text-white hover:bg-brand-blue-dark"
        >
          Try the demo
          <ArrowIcon />
        </Link>
        <p className="mt-3 text-muted">This is the demo: no account needed, and your jobs stay in this browser.</p>
      </div>
    )
  }

  if (session) {
    return (
      <div id="sign-in" className={SIGN_IN_AREA}>
        <Link
          to="/stash"
          className="press inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-lg bg-brand-blue text-lg font-semibold text-white hover:bg-brand-blue-dark"
        >
          Go to My Stash
          <ArrowIcon />
        </Link>
        <p className="mt-3 text-muted">
          Signed in as <span className="font-semibold text-ink">{session.user.email}</span>
        </p>
      </div>
    )
  }

  async function signIn() {
    setStatus('leaving')
    setError(null)
    const { error: problem } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Come back to My Stash. BASE_URL keeps this right on any host.
        redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}stash`,
      },
    })
    // On success the browser is already on its way to Google, so only a
    // failure (Supabase unreachable, sign-in switched off) gets this far.
    if (problem) {
      setError(problem.message)
      setStatus('error')
    }
  }

  // Google's button handed over its signed note; Supabase checks it.
  async function signInWithGoogleNote(token, nonce) {
    setStatus('checking')
    setError(null)
    const { error: problem } = await supabase.auth.signInWithIdToken({ provider: 'google', token, nonce })
    if (problem) {
      setError(problem.message)
      setStatus('error')
      setAttempt((count) => count + 1)
      return
    }
    navigate('/stash')
  }

  return (
    <div id="sign-in" className={SIGN_IN_AREA}>
      {note === 'expired' && (
        <p className="mb-4 rounded-card border border-line bg-todo-bg p-3 text-ink" role="status">
          Your sign-in expired. Please sign in again to get back to your stash.
        </p>
      )}
      {note === 'signed-out' && (
        <p className="mb-4 rounded-card border border-line bg-done-bg p-3 text-ink" role="status">
          You've signed out. Your stash is safe, and nobody using this browser can open it.
        </p>
      )}
      {withGoogleButton ? (
        <GoogleButton
          attempt={attempt}
          onToken={signInWithGoogleNote}
          onUnavailable={() => setWithGoogleButton(false)}
        />
      ) : (
        <button
          type="button"
          onClick={signIn}
          // While the sign-in is still being checked, don't offer it yet: the
          // visitor may already be signed in.
          disabled={loading || status === 'leaving'}
          className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-lg border border-line bg-surface text-lg font-semibold text-ink shadow-sm hover:bg-subtle disabled:opacity-60"
        >
          <GoogleIcon />
          {status === 'leaving' ? 'Opening Google…' : 'Sign in with Google'}
        </button>
      )}

      {status === 'error' ? (
        <p className="mt-3 text-error" role="alert">Couldn't sign in: {error}</p>
      ) : status === 'checking' ? (
        <p className="mt-3 text-muted" role="status">Signing you in…</p>
      ) : (
        <p className="mt-3 text-muted">
          No new password to remember. We only use your Google account to know it's you.
        </p>
      )}
    </div>
  )
}

// Sign out, beside the initials circle when signed in (wider screens). The
// same as the dashboard's (AppHeader.jsx): plain text, blue on hover.
function SignOutButton() {
  const [leaving, setLeaving] = useState(false)

  async function handleSignOut() {
    setLeaving(true)
    await signOut()
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={leaving}
      className="min-h-11 rounded-lg px-2 font-medium text-ink hover:text-brand-blue disabled:opacity-60"
    >
      {leaving ? 'Signing out…' : 'Sign out'}
    </button>
  )
}

// ---- Icons. Drawn here so there is no icon package to install. All are
// decoration next to text that says the same thing, so screen readers skip them.

function Icon({ children, className = 'size-6' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

function LinkIcon() {
  return <Icon><path d="M10 14a4.5 4.5 0 006.4.4l3-3a4.5 4.5 0 00-6.4-6.4l-1.2 1.2M14 10a4.5 4.5 0 00-6.4-.4l-3 3a4.5 4.5 0 006.4 6.4l1.2-1.2" /></Icon>
}

function CheckIcon() {
  return <Icon><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.7 2.7L16 9.5" /></Icon>
}

function BoltIcon() {
  return <Icon><path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="currentColor" /></Icon>
}

function CapIcon() {
  return <Icon><path d="M2 9l10-5 10 5-10 5zM6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5M22 9v6" /></Icon>
}

function LockIcon() {
  return <Icon><path d="M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4M12 15v2" /></Icon>
}

function DevicesIcon() {
  return <Icon><path d="M4 16V6a2 2 0 012-2h11a2 2 0 012 2v2M2 20h11M16 10h5a1 1 0 011 1v9a1 1 0 01-1 1h-5a1 1 0 01-1-1v-9a1 1 0 011-1zM18.5 18h.01" /></Icon>
}

// Google's "G", in Google's own colours (their sign-in button guidelines ask
// for the logo unchanged). Decoration: the button text already says Google.
function GoogleIcon() {
  return (
    <svg className="size-6 shrink-0" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

function ArrowIcon() {
  return <Icon className="size-5"><path d="M5 12h14M13 6l6 6-6 6" /></Icon>
}
