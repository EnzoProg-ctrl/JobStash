import { createContext, useContext, useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router'
import { supabase } from './supabase.js'

// Who is signed in, known once and shared by the whole app.
//
//   const { session, loading, demo } = useAuth()
//
// session is Supabase's sign-in session (null when signed out), loading is
// true only while it is first being worked out, and demo is true in demo mode,
// where there are no accounts at all.

const AuthContext = createContext({ session: null, loading: false, demo: true })

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(Boolean(supabase))

  useEffect(() => {
    if (!supabase) return

    // Straight after Google sends someone back, this also finishes swapping
    // the one-time code for a session, so `loading` covers that moment too.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    // Kept up to date from then on: signing in, signing out, a pass renewed.
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next)
      setLoading(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ session, loading, demo: !supabase }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

// A route wrapper: the screens inside it are only for signed-in people.
// Signed-out visitors go to the landing page, which is where signing in is.
// Demo mode has no accounts, so everything stays open there.
export function RequireSignIn() {
  const { session, loading, demo } = useAuth()

  if (demo) return <Outlet />
  if (loading) {
    return <p className="p-8 text-center text-muted" role="status">Checking your sign-in…</p>
  }
  if (!session) return <Navigate to="/" replace />
  return <Outlet />
}

// The Sign out button (components/AppHeader.jsx). Ends this browser's sign-in
// only, so the person stays signed in on their other devices. Supabase forgets
// the sign-in here even if it can't reach its server, so this can't leave a
// shared computer signed in by mistake. RequireSignIn then sees nobody is
// signed in and moves the visitor to the landing page, which says so.
export async function signOut() {
  if (!supabase) return
  leaveSignInNote('signed-out')
  await supabase.auth.signOut({ scope: 'local' })
}

// A short note for the landing page, so it can explain why the visitor ended
// up back there: 'expired' when the API stopped accepting the sign-in (see
// api/httpApi.js), or 'signed-out' after the Sign out button. Kept in
// sessionStorage. Reading and clearing are separate steps because React may
// read twice while drawing the page; clearing waits until it is on screen.
const NOTE_KEY = 'jobstash:sign-in-note'

export function leaveSignInNote(note) {
  try {
    sessionStorage.setItem(NOTE_KEY, note)
  } catch {
    // Storage blocked. The visitor still lands on the sign-in page.
  }
}

export function readSignInNote() {
  try {
    return sessionStorage.getItem(NOTE_KEY)
  } catch {
    return null
  }
}

export function clearSignInNote() {
  try {
    sessionStorage.removeItem(NOTE_KEY)
  } catch {
    // Nothing to clear.
  }
}
