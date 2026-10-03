import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The site is served from the root of its address ("/"), locally and on
// Vercel. VITE_BASE_PATH is only for hosting it in a subfolder, such as
// "/<repository-name>/" on a GitHub project page, which JobStash no longer uses. Page 7 of content/extending-your-app explains
// what goes wrong without this: a blank white page and 404s on every asset.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.VITE_BASE_PATH || '/',
  server: {
    // Only used by `npm run dev`. It is NOT part of the production build, which
    // is why the deployed site needs CORS and this does not. See page 8.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
