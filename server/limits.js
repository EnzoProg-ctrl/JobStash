import { rateLimit } from 'express-rate-limit'

// Rate limits: how often one visitor may call the API, so one person (or a
// script) can't flood it and slow it down for everyone else. Going over the
// limit gets a 429 with a plain message, and the RateLimit header tells the
// caller how long to wait.
//
// The counts live in this server's memory. That is right for one server, and
// they start again from zero when it restarts. If the API ever runs on several
// servers at once, they need a shared store (Redis, for example) instead, or
// each server would count on its own.

// Every request from one device (IP address): 100 a minute. Normal use is a
// handful. This also slows down anyone trying fake sign-in passes over and
// over, because it runs before the sign-in check. /healthz is left out, so a
// host checking that the API is up is never turned away.
export const perDevice = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: (request) => request.path === '/healthz',
  message: { error: 'Too many requests. Please wait a minute and try again.' },
})

// Saving new jobs, per account: 50 an hour. Someone saving jobs by hand adds a
// few a day, so this only stops a script or a stuck button. It counts by
// account, not device, so it must come after requireUser (auth.js).
export const newJobsPerAccount = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 50,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (request) => request.userId,
  message: { error: "You've saved a lot of jobs in the last hour. Please wait a while and try again." },
})
