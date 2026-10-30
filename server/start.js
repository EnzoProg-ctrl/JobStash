// Starts the API as an always-on server: on your computer (npm run dev /
// npm start). On Vercel this file isn't used; Vercel runs the app from
// server.js for each request.
import app, { allowedOrigins } from './server.js'
import { pool } from './db/pool.js'

// The host chooses the port and tells you through PORT. Hardcoding 3000 is the
// commonest reason a first deploy is marked unhealthy and killed.
const port = process.env.PORT || 3000

const server = app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
  console.log(`CORS allows: ${allowedOrigins.join(', ')}`)
})

// Safe restarts. A host stops the API with SIGTERM on every deploy and
// restart, and Ctrl+C sends SIGINT. Instead of dropping whatever is in
// progress, stop taking new requests, let the open ones finish, close the
// database connections, then exit. If something hangs, give up after 10
// seconds, because the host will force it soon after anyway.
function shutDown(signal) {
  console.log(`${signal} received: finishing open requests, then stopping`)
  server.close(async () => {
    await pool.end()
    console.log('Stopped cleanly')
    process.exit(0)
  })
  setTimeout(() => {
    console.error('Still busy after 10 seconds, stopping anyway')
    process.exit(1)
  }, 10_000).unref()
}

process.once('SIGTERM', () => shutDown('SIGTERM'))
process.once('SIGINT', () => shutDown('SIGINT'))
