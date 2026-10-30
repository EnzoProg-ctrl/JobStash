import { Navigate, Outlet, Route, Routes } from 'react-router'
import AppHeader from './components/AppHeader.jsx'
import BottomNav from './components/BottomNav.jsx'
import BrandAside from './components/BrandAside.jsx'
import HomePage from './pages/HomePage.jsx'
import StashPage from './pages/StashPage.jsx'
import PrivacyPage from './pages/PrivacyPage.jsx'
import OverviewPage from './pages/OverviewPage.jsx'
import AddJobDialog from './components/AddJobDialog.jsx'
import { AuthProvider, RequireSignIn } from './lib/auth.jsx'

// The landing page, the privacy notice, My Stash, and the Add Job pop-up on
// top of My Stash. Every other address goes back to Home.
//
// The landing page has its own header and full-width layout. The app screens
// share AppLayout, so they keep the same header and width, and they sit inside
// RequireSignIn, so only signed-in people reach them (outside demo mode).
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route element={<RequireSignIn />}>
          <Route element={<AppLayout />}>
            <Route path="/stash" element={<StashPage />}>
              {/* Two pop-ups: the usual one fills in the company and position
                  from the link; /manual is for typing them yourself. The keys
                  make switching between them open a fresh pop-up. */}
              <Route path="add" element={<AddJobDialog key="auto" />} />
              <Route path="add/manual" element={<AddJobDialog key="manual" manual />} />
            </Route>
              <Route path="/overview" element={<OverviewPage />} />
            {/* Old links to /add still work. */}
            <Route path="/add" element={<Navigate to="/stash/add" replace />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

// Wide screens: a narrow brand column at the left edge (BrandAside.jsx), then
// the page, which fills the rest of the screen. Phones and tablets: just the
// page. pb-32 on phones keeps the last job clear of the bottom bar.
//
// The page stops growing at 1536px (max-w-384) and stays on the left, by the
// brand column, so rows don't stretch across a very wide monitor.
function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <div className="flex w-full flex-1">
        <BrandAside />
        <main className="min-w-0 flex-1 px-4 pt-8 pb-32 md:px-8 md:pt-10 md:pb-14 lg:pl-12">
          <div className="max-w-384">
            <Outlet />
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
