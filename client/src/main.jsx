import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App.jsx'
import './styles.css'

// basename is the folder the site is served from: "/" locally and on Vercel,
// "/<repo>/" on GitHub Pages. Vite fills in BASE_URL from vite.config.js, so the
// links work in both places without hardcoding either.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>
)
