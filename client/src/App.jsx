import { Navigate, Outlet, Route, Routes } from 'react-router'
import AppHeader from './components/AppHeader.jsx'
import HomePage from './pages/HomePage.jsx'
import StashPage from './pages/StashPage.jsx'
import AddJobPage from './pages/AddJobPage.jsx'

// The three screens from the wireframes. Every other address goes back to Home.
//
// The landing page has its own header and full-width layout. The app screens
// share AppLayout, so they keep the same header and width.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route element={<AppLayout />}>
        <Route path="/stash" element={<StashPage />} />
        <Route path="/add" element={<AddJobPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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
