import { NavLink, Navigate, Route, Routes } from 'react-router'
import DemoNotice from './components/DemoNotice.jsx'
import HomePage from './pages/HomePage.jsx'
import StashPage from './pages/StashPage.jsx'
import AddJobPage from './pages/AddJobPage.jsx'

// The three screens from the wireframes. Every other address goes back to Home.

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/stash', label: 'My Stash' },
  { to: '/add', label: 'Add Job' },
]

export default function App() {
  return (
    <div className="min-h-screen bg-bg font-sans text-ink">
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

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/stash" element={<StashPage />} />
          <Route path="/add" element={<AddJobPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
