import { Navigate, Outlet, Route, Routes } from 'react-router'
import AppHeader from './components/AppHeader.jsx'
import HomePage from './pages/HomePage.jsx'
import StashPage from './pages/StashPage.jsx'
import AddJobDialog from './components/AddJobDialog.jsx'
import { AuthProvider, RequireSignIn } from './lib/auth.jsx'

// The landing page, My Stash, and the Add Job pop-up on top of My Stash.
// Every other address goes back to Home.
//
// The landing page has its own header and full-width layout. The app screens
// share AppLayout, so they keep the same header and width, and they sit inside
// RequireSignIn, so only signed-in people reach them (outside demo mode).
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route element={<RequireSignIn />}>
          <Route element={<AppLayout />}>
            <Route path="/stash" element={<StashPage />}>
              <Route path="add" element={<AddJobDialog />} />
            </Route>
            {/* Old links to /add still work. */}
            <Route path="/add" element={<Navigate to="/stash/add" replace />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

function AppLayout() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-10">
        <Outlet />
      </main>
    </div>
  )
}
