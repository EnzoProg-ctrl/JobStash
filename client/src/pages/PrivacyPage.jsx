import { useEffect } from 'react'
import { Link } from 'react-router'
import Logo from '../components/Logo.jsx'

// The privacy notice, at /privacy. Open to everyone, signed in or not, because
// Google links to it from its sign-in screen. Written in plain words, and it
// only promises what the code actually does: if the app changes what it keeps,
// this page changes with it, along with UPDATED.

const CONTACT = 'centenoenzo054@gmail.com'
const UPDATED = '3 October 2026'

export default function PrivacyPage() {
  // Links keep the scroll position of the page they came from (the landing
  // footer is at the very bottom), so start this page at the top. Instantly:
  // the site scrolls smoothly (styles.css), and gliding up from the bottom of
  // a page you just opened would look odd.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-5 md:px-8">
        <Link to="/" aria-label="JobStash home">
          <Logo className="text-2xl md:text-3xl" />
        </Link>
        <Link to="/" className="text-muted hover:text-ink">Back to home</Link>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-6 pb-16 md:px-8">
        <h1 className="text-heading font-bold">Privacy</h1>
        <p className="mt-2 text-muted">Last updated {UPDATED}</p>

        <p className="mt-6 rounded-card border border-line bg-surface p-5 text-lg">
          <strong>In short:</strong> JobStash keeps only what it needs to save your job list.
          No ads, no selling your data, no tracking. Only you can see your saved jobs.
        </p>

        <Section title="What JobStash keeps">
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>From Google, when you sign in:</strong> your name, email address and profile
              picture. They're used only to know it's you and to show which account you're signed
              in with. JobStash never sees your Google password, and it can't read your email,
              contacts or anything else in your Google account.
            </li>
            <li>
              <strong>The jobs you save:</strong> the link, the company, the job title, whether
              it's To Apply or Done, and when you saved it.
            </li>
          </ul>
        </Section>

        <Section title="What JobStash doesn't do">
          <ul className="list-disc space-y-2 pl-6">
            <li>It doesn't show ads.</li>
            <li>It doesn't sell your data or share it with anyone for their own use.</li>
            <li>It doesn't use tracking or advertising cookies, or analytics that follow you around.</li>
          </ul>
        </Section>

        <Section title="Who can see your jobs">
          <p>
            Only you. Each account sees its own jobs and nobody else's. The person who runs
            JobStash can reach the database to keep it working and fix problems, but doesn't look
            through anyone's jobs.
          </p>
        </Section>

        <Section title="What's kept in your browser">
          <p>
            Your browser remembers that you're signed in, so you don't have to sign in on every
            visit. <strong>Sign out</strong> in My Stash removes it. On a shared computer, sign out
            when you're done.
          </p>
        </Section>

        <Section title="Short technical records">
          <p>
            To keep JobStash running and stop anyone from flooding it, the server notes the time,
            the page asked for and whether it worked. These records don't include your name,
            email or jobs. Your device's internet address is used for about a minute to count
            requests (the limit is 100 a minute), and isn't saved.
          </p>
        </Section>

        <Section title="Who helps run JobStash">
          <p>JobStash uses these services, which handle data only to run it:</p>
          <ul className="mt-3 list-disc space-y-2 pl-6">
            <li><strong>Google</strong>, for signing in.</li>
            <li><strong>Supabase</strong>, which stores your account and saved jobs, in Singapore.</li>
            <li><strong>Render</strong>, which runs the JobStash server, in Singapore.</li>
            <li><strong>Vercel</strong>, which serves the website.</li>
          </ul>
        </Section>

        <Section title="Deleting your data">
          <p>
            To delete your account and every job you've saved, email{' '}
            <a href={`mailto:${CONTACT}`} className="font-semibold text-brand-blue underline">{CONTACT}</a>{' '}
            from the Google account you sign in with. It's done within 7 days, and it can't be
            undone.
          </p>
        </Section>

        <Section title="Changes and questions">
          <p>
            If this page changes, the date at the top changes too. Questions? Email{' '}
            <a href={`mailto:${CONTACT}`} className="font-semibold text-brand-blue underline">{CONTACT}</a>.
            JobStash is a student project by Laurenzo Centeno.
          </p>
        </Section>
      </main>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="mt-3 leading-relaxed text-ink">{children}</div>
    </section>
  )
}
