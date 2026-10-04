import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import DemoNotice from '../components/DemoNotice.jsx'
import GoogleButton, { googleButtonAvailable } from '../components/GoogleButton.jsx'
import LandingMenu from '../components/LandingMenu.jsx'
import Logo from '../components/Logo.jsx'
import { supabase } from '../lib/supabase.js'
import { clearSignInNote, readSignInNote, useAuth } from '../lib/auth.jsx'
import { usePageTitle } from '../lib/usePageTitle.js'
import phoneImage from '../assets/landing-phone.webp'

// The landing page. Its own header and footer, and full width, unlike the app
// screens that share AppLayout.

const FEATURES = [
  { icon: BookmarkIcon, title: 'Save in seconds', text: 'Store job postings with just a link.' },
  { icon: ListIcon, title: 'Stay organized', text: 'Keep track of what to apply to.' },
  { icon: BoltIcon, title: 'Focus on what matters', text: 'Your future, on your terms.' },
]

// Each person only sees their own jobs: the API checks who is signed in and
// only returns that person's jobs (server/jobsRepo.js). In demo mode the jobs
// never leave the browser, so the promise holds there too.
const PROMISES = [
  { icon: CapIcon, title: 'Built for everyone', text: 'Designed to make your job hunt simpler.' },
  { icon: LockIcon, title: 'Your data stays private', text: 'Only you can see your saved jobs.' },
  { icon: DevicesIcon, title: 'On any device', text: 'Save jobs from your phone or computer.' },
]

export default function HomePage() {
  const { session, demo } = useAuth()
  usePageTitle()

  return (
    <div className="min-h-screen overflow-x-clip">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-5 min-[360px]:gap-4 md:px-8">
        <Link to="/" aria-label="JobStash home">
          {/* On the narrowest phones (under 360px) only the mark shows, so the
              mark, the button and the ⋮ menu fit on one line. The link's label
              still says "JobStash home" for screen readers. */}
          <Logo className="text-2xl md:text-3xl" wordClassName="max-[359px]:sr-only" />
        </Link>
        <nav className="flex items-center gap-2 md:gap-8" aria-label="Page sections">
          <a href="#how-it-works" className="hidden text-muted hover:text-ink md:inline">How it works</a>
          <a href="#features" className="hidden text-muted hover:text-ink md:inline">Features</a>
          {session ? (
            <Link
              to="/stash"
              className="press inline-flex min-h-11 items-center rounded-lg bg-brand-blue px-3 font-semibold whitespace-nowrap min-[360px]:px-4 text-white hover:bg-todo md:px-8"
            >
              My Stash
            </Link>
          ) : (
            <a
              href="#sign-in"
              className="press inline-flex min-h-11 items-center rounded-lg bg-brand-blue px-3 font-semibold whitespace-nowrap min-[360px]:px-4 text-white hover:bg-todo md:px-8"
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

        <section className="grid items-center gap-12 py-8 lg:grid-cols-[1.35fr_1fr] lg:py-10">
          <div>
            <p className="inline-block rounded-full bg-todo-bg px-4 py-1.5 text-sm text-ink">
              A simpler way to job hunt
            </p>
            <h1 className="mt-6 text-4xl leading-tight font-bold tracking-tight md:text-display">
              Found it on your phone?
              <span className="block text-brand-blue">Stash it. Apply later.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted md:text-xl">
              Save job postings, keep track of what to apply to, and stay one step
              closer to your future.
            </p>
            <SignIn />
          </div>

          <HeroImage />
        </section>

        <section id="how-it-works" className="grid scroll-mt-8 gap-8 py-5 sm:grid-cols-3" aria-label="How it works">
          {FEATURES.map((item) => (
            <div key={item.title}>
              <span className="flex size-14 items-center justify-center rounded-full bg-todo-bg text-brand-blue">
                <item.icon />
              </span>
              <h2 className="mt-4 text-lg font-bold">{item.title}</h2>
              <p className="mt-1 text-muted">{item.text}</p>
            </div>
          ))}
        </section>

        <section
          id="features"
          className="my-10 grid scroll-mt-8 divide-y divide-line rounded-card border border-line bg-surface md:grid-cols-3 md:divide-x md:divide-y-0"
          aria-label="Features"
        >
          {PROMISES.map((item) => (
            <div key={item.title} className="flex items-center gap-4 p-6">
              <span className="shrink-0 text-primary">
                <item.icon />
              </span>
              <div>
                <h2 className="font-bold">{item.title}</h2>
                <p className="text-sm text-muted">{item.text}</p>
              </div>
            </div>
          ))}
        </section>
      </main>

      <footer className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 sm:flex-row sm:items-center sm:gap-6 md:px-8">
        <Logo className="text-2xl" />
        <p className="text-sm text-muted">Stash today. A brighter tomorrow.</p>
        <Link to="/privacy" className="text-sm text-muted underline hover:text-ink sm:ml-auto">Privacy</Link>
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
      <div id="sign-in" className="mt-8 max-w-md scroll-mt-8">
        <Link
          to="/stash"
          className="press inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-lg bg-primary text-lg font-semibold text-white hover:bg-ink"
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
      <div id="sign-in" className="mt-8 max-w-md scroll-mt-8">
        <Link
          to="/stash"
          className="press inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-lg bg-primary text-lg font-semibold text-white hover:bg-ink"
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
    <div id="sign-in" className="mt-8 max-w-md scroll-mt-8">
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

function HeroImage() {
  return (
    // On wide screens the phone shifts left (xl:mr-36) to leave room for the
    // handwritten notes on its right.
    <div className="relative isolate mx-auto w-full max-w-sm xl:mr-36">
      {/* The soft blob behind the phone. Decoration only. It is bigger than
          the picture, and on phones the picture sits under the sign-in
          button, so the blob reaches over the button: pointer-events-none
          lets taps go through it to the button. */}
      <svg className="pointer-events-none absolute inset-0 -z-10 size-full scale-175" viewBox="0 0 400 400" aria-hidden="true">
        <path
          fill="#EAF1FF"
          d="M286 58C336 78 372 128 366 182C361 226 322 240 330 282C338 326 300 368 250 370C204 372 186 338 142 344C92 351 44 322 38 268C32 218 74 196 66 150C58 100 96 50 150 44C196 39 240 40 286 58Z"
        />
      </svg>

      <img
        src={phoneImage}
        width="1024"
        height="1536"
        // Lowercase on purpose: React 18 doesn't know the camelCase name and
        // warns about it. It still reaches the browser as the real attribute.
        fetchpriority="high"
        alt="JobStash on a phone, showing My Stash with saved jobs, next to the Add Job form"
        className="w-full"
      />

      {/* Handwritten notes, wide screens only: on smaller ones they crowd the
          image. Each sits just past the phone's right edge (left-full). */}
      <HandNote className="top-[6%]">
        Save now.
        <br />
        Apply later.
      </HandNote>
      <HandNote className="top-[58%]">
        Add a job
        <br />
        in under
        <br />
        10 seconds.
      </HandNote>
    </div>
  )
}

function HandNote({ className, children }) {
  return (
    <div className={`absolute left-full hidden w-40 xl:block ${className}`} aria-hidden="true">
      <svg className="mb-1 h-8 w-16 text-primary" viewBox="0 0 64 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M60 6C44 4 22 10 8 24M8 24l2-11M8 24l11-1" />
      </svg>
      <p className="-rotate-6 font-hand text-3xl leading-tight text-primary">{children}</p>
    </div>
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

function BookmarkIcon() {
  return <Icon><path d="M6 3h12v18l-6-4-6 4z" fill="currentColor" /></Icon>
}

function ListIcon() {
  return <Icon><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" /></Icon>
}

function BoltIcon() {
  return <Icon><path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="currentColor" /></Icon>
}

function CapIcon() {
  return <Icon className="size-9"><path d="M2 9l10-5 10 5-10 5zM6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5M22 9v6" /></Icon>
}

function LockIcon() {
  return <Icon className="size-9"><path d="M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4M12 15v2" /></Icon>
}

function DevicesIcon() {
  return <Icon className="size-9"><path d="M4 16V6a2 2 0 012-2h11a2 2 0 012 2v2M2 20h11M16 10h5a1 1 0 011 1v9a1 1 0 01-1 1h-5a1 1 0 01-1-1v-9a1 1 0 011-1zM18.5 18h.01" /></Icon>
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
