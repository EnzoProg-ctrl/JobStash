import { useEffect, useRef, useState } from 'react'

// Google's own "Sign in with Google" button (Google Identity Services).
//
// Why not a plain button that sends you to Google? That way goes through
// Supabase's address, so Google's screen said "Sign in to
// ifulimffoqxwfzwjnaaz.supabase.co". With Google's own button, the sign-in
// starts on this site, so Google names this site instead (and "JobStash" once
// Google has approved the app's branding).
//
// How it works: you pick your account in Google's window, Google hands this
// page a signed note saying who you are (an "ID token"), and onToken(token,
// nonce) passes it to Supabase, which checks Google's signature and signs you
// in. The nonce is a random one-time value: Google seals a fingerprint of it
// inside the note and Supabase checks it matches, so a note can't be copied
// from somewhere else and replayed here.
//
// If Google's script can't load (blocked by an ad blocker, say) or no client
// ID is set, onUnavailable() is called and the page shows its old button.

// hl=en: Google's button and windows in English, like the rest of the site.
// Without it they follow the browser's language (Tagalog on a Filipino phone).
const SCRIPT = 'https://accounts.google.com/gsi/client?hl=en'
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

let loading = null
function loadGoogle() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google)
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT
    script.async = true
    script.onload = () => (window.google?.accounts?.id ? resolve(window.google) : reject(new Error('no google')))
    script.onerror = () => {
      loading = null
      script.remove()
      reject(new Error("Google's sign-in couldn't load"))
    }
    document.head.appendChild(script)
  })
  return loading
}

// A random one-time value, and the SHA-256 fingerprint of it that Google gets.
async function makeNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  const nonce = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(nonce))
  const hashed = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  return { nonce, hashed }
}

export const googleButtonAvailable = Boolean(CLIENT_ID)

export default function GoogleButton({ onToken, onUnavailable, attempt = 0 }) {
  const slot = useRef(null)
  const [ready, setReady] = useState(false)
  // The latest onToken, so Google's callback never calls an old one.
  const latest = useRef(onToken)
  latest.current = onToken

  useEffect(() => {
    let cancelled = false
    // Give up and use the old button if Google hasn't answered in 8 seconds.
    const giveUp = setTimeout(() => !cancelled && onUnavailable(), 8000)

    Promise.all([loadGoogle(), makeNonce()])
      .then(([google, { nonce, hashed }]) => {
        if (cancelled) return
        clearTimeout(giveUp)
        google.accounts.id.initialize({
          client_id: CLIENT_ID,
          nonce: hashed,
          context: 'signin',
          ux_mode: 'popup',
          callback: ({ credential }) => latest.current(credential, nonce),
        })
        google.accounts.id.renderButton(slot.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text: 'signin_with',
          logo_alignment: 'center',
          // English, like the rest of the site (otherwise it follows the
          // browser's language).
          locale: 'en',
          // Google's button is at most 400px wide; match the space it's in.
          width: Math.min(400, slot.current.offsetWidth || 320),
        })
        setReady(true)
      })
      .catch(() => {
        clearTimeout(giveUp)
        if (!cancelled) onUnavailable()
      })

    return () => {
      cancelled = true
      clearTimeout(giveUp)
    }
    // A new attempt (after a failed sign-in) draws a fresh button with a
    // fresh one-time value.
  }, [attempt])

  return (
    // Lined up on the left, like the headline and text above it. Google's
    // button is at most 400px wide and 40px tall, and only Google can draw
    // inside it, so the space around it is sized to match.
    <div className="relative min-h-10 w-full max-w-[400px]">
      {/* Google draws its button in here. */}
      <div ref={slot} className={`w-full ${ready ? '' : 'invisible'}`} />
      {/* Until then, a grey stand-in the same size, so nothing jumps. */}
      {!ready && (
        <div className="absolute inset-x-0 top-0 h-10 animate-pulse rounded-md bg-subtle" aria-hidden="true" />
      )}
    </div>
  )
}
