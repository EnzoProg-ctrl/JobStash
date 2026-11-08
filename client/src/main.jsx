import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App.jsx'
import './styles.css'
// Light or dark theme: sets it up and follows the device (lib/theme.js).
import './lib/theme.js'

// basename is the folder the site is served from: "/" locally and on Vercel.
// Vite fills in BASE_URL from vite.config.js, so the links would still work if
// the site were ever served from a subfolder.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>
)
