import { NavLink, Navigate, Outlet, Route, Routes } from 'react-router'
import DemoNotice from './components/DemoNotice.jsx'
import HomePage from './pages/HomePage.jsx'
import StashPage from './pages/StashPage.jsx'
import AddJobPage from './pages/AddJobPage.jsx'

// The three screens from the wireframes. Every other address goes back to Home.
//
// The landing page has its own header and full-width layout. The app screens
// share AppLayout, so they keep the same menu and width.
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

// Inside the app, My Stash is home. The landing page at "/" is for visitors,
// so it is not in this menu.
const LINKS = [
  { to: '/stash', label: 'My Stash' },
  { to: '/add', label: 'Add Job' },
]

function AppLayout() {
  return (
    <div className="min-h-screen">
      {/* Temporary menu so the pages can be reached. It is replaced by the
          sidebar and phone menu from the mockup. */}
      <nav className="flex gap-2 border-b border-line bg-surface px-4 py-3">
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end
            className={({ isActive }) =>
              `rounded-full px-4 py-2 text-sm font-semibold ${
                isActive ? 'bg-primary text-white' : 'bg-subtle text-ink'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <DemoNotice />
        <Outlet />
      </main>
    </div>
  )
}
