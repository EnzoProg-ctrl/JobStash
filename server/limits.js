import { rateLimit } from 'express-rate-limit'
import { PostgresStore } from './rateLimitStore.js'

// Rate limits: how often one visitor may call the API, so one person (or a
// script) can't flood it and slow it down for everyone else. Going over the
// limit gets a 429 with a plain message, and the RateLimit header tells the
// caller how long to wait.
//
// The counts live in the database (rateLimitStore.js), so every copy of the
// API shares them: on Vercel several copies run at once.
//
// If the database can't be reached to count, the request goes through
// instead of failing (passOnStoreError). The error is logged, and the request
// will most likely fail at the database next anyway, with the usual message.
const shared = {
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  passOnStoreError: true,
}

// Every request from one device (IP address): 100 a minute. Normal use is a
// handful. This also slows down anyone trying fake sign-in passes over and
// over, because it runs before the sign-in check. /healthz is left out, so a
// host checking that the API is up is never turned away.
export const perDevice = rateLimit({
  ...shared,
  store: new PostgresStore('device'),
  windowMs: 60 * 1000,
  limit: 100,
  skip: (request) => request.path === '/healthz',
  message: { error: 'Too many requests. Please wait a minute and try again.' },
})

// Saving new jobs, per account: 50 an hour. Someone saving jobs by hand adds a
// few a day, so this only stops a script or a stuck button. It counts by
// account, not device, so it must come after requireUser (auth.js).
export const newJobsPerAccount = rateLimit({
  ...shared,
  store: new PostgresStore('jobs'),
  windowMs: 60 * 60 * 1000,
  limit: 50,
  keyGenerator: (request) => request.userId,
  message: { error: "You've saved a lot of jobs in the last hour. Please wait a while and try again." },
})

// Reading a job link's page (GET /api/preview), per account: 60 every 10
// minutes. Each one makes this server open someone else's website, so it has
// its own, tighter limit; pasting links by hand needs a few.
export const previewsPerAccount = rateLimit({
  ...shared,
  store: new PostgresStore('previews'),
  windowMs: 10 * 60 * 1000,
  limit: 60,
  keyGenerator: (request) => request.userId,
  message: { error: "You've looked up a lot of links in the last few minutes. Please wait a moment and type the details instead." },
})
