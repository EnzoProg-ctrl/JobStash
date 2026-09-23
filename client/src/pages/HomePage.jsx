import { useState } from 'react'
import { Link } from 'react-router'
import DemoNotice from '../components/DemoNotice.jsx'
import Logo from '../components/Logo.jsx'
import phoneImage from '../assets/landing-phone.webp'

// The landing page. Its own header and footer, and full width, unlike the app
// screens that share AppLayout.

const FEATURES = [
  { icon: BookmarkIcon, title: 'Save in seconds', text: 'Store job postings with just a link.' },
  { icon: ListIcon, title: 'Stay organized', text: 'Keep track of what to apply to.' },
  { icon: BoltIcon, title: 'Focus on what matters', text: 'Your future, on your terms.' },
]

// "Your data stays private" belongs here once accounts exist. Until then every
// visitor shares one list, so the page promises something true instead.
const PROMISES = [
  { icon: CapIcon, title: 'Built for students', text: 'Designed to make your job hunt simpler.' },
  { icon: TagIcon, title: 'Free to use', text: 'No ads, no fees.' },
  { icon: DevicesIcon, title: 'On any device', text: 'Save jobs from your phone or computer.' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-clip">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 md:px-8">
        <Link to="/" aria-label="JobStash home">
          <Logo className="text-2xl md:text-3xl" />
        </Link>
        <nav className="flex items-center gap-6 md:gap-8" aria-label="Page sections">
          <a href="#how-it-works" className="hidden text-muted hover:text-ink md:inline">How it works</a>
          <a href="#features" className="hidden text-muted hover:text-ink md:inline">Features</a>
          <a
            href="#sign-in"
            className="inline-flex min-h-11 items-center rounded-lg bg-brand-blue px-5 font-semibold text-white hover:bg-todo md:px-8"
          >
            Sign in
          </a>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 md:px-8">
        <DemoNotice />

        <section className="grid items-center gap-12 py-8 lg:grid-cols-[1.35fr_1fr] lg:py-12">
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
            <SignInForm />
          </div>

          <HeroImage />
        </section>

        <section id="how-it-works" className="grid scroll-mt-8 gap-8 py-10 sm:grid-cols-3" aria-label="How it works">
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
      </footer>
    </div>
  )
}

// Sign-in is not built yet, so this form does not send or keep the email. It
// says so, and points at the demo instead of pretending to work.
function SignInForm() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <form id="sign-in" onSubmit={handleSubmit} className="mt-8 max-w-md scroll-mt-8">
      <label htmlFor="email" className="sr-only">Email address</label>
      <div className="flex min-h-14 items-center gap-3 rounded-lg border border-line bg-surface px-4 focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-primary">
        <MailIcon />
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Enter your email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full bg-transparent text-base outline-none placeholder:text-muted"
        />
      </div>
      <button
        type="submit"
        className="mt-4 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-lg bg-primary text-lg font-semibold text-white hover:bg-ink"
      >
        Email me a sign-in link
        <ArrowIcon />
      </button>

      {submitted ? (
        <p className="mt-3 text-ink" role="status">
          Sign-in is coming soon. For now,{' '}
          <Link to="/stash" className="font-semibold text-brand-blue underline">
            try the demo →
          </Link>
        </p>
      ) : (
        <p className="mt-3 text-muted">We'll send you a link to sign in. No password required.</p>
      )}
    </form>
  )
}

function HeroImage() {
  return (
    // On wide screens the phone shifts left (xl:mr-36) to leave room for the
    // handwritten notes on its right.
    <div className="relative isolate mx-auto w-full max-w-sm xl:mr-36">
      {/* The soft blob behind the phone. Decoration only. */}
      <svg className="absolute inset-0 -z-10 size-full scale-125" viewBox="0 0 400 400" aria-hidden="true">
        <path
          fill="#EAF1FF"
          d="M312 72c38 33 58 88 50 141-8 54-44 106-96 132-51 26-118 26-163-6S34 245 40 187c6-57 44-111 95-140 51-30 139-8 177 25z"
        />
      </svg>

      <img
        src={phoneImage}
        width="1024"
        height="1536"
        fetchPriority="high"
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

function TagIcon() {
  return <Icon className="size-9"><path d="M3 12V3h9l9 9-9 9zM7.5 7.5h.01" /></Icon>
}

function DevicesIcon() {
  return <Icon className="size-9"><path d="M4 16V6a2 2 0 012-2h11a2 2 0 012 2v2M2 20h11M16 10h5a1 1 0 011 1v9a1 1 0 01-1 1h-5a1 1 0 01-1-1v-9a1 1 0 011-1zM18.5 18h.01" /></Icon>
}

function MailIcon() {
  return <Icon className="size-6 shrink-0 text-muted"><path d="M3 6h18v12H3zM3 7l9 6 9-6" /></Icon>
}

function ArrowIcon() {
  return <Icon className="size-5"><path d="M5 12h14M13 6l6 6-6 6" /></Icon>
}
