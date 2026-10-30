import { createHmac } from 'node:crypto'
import { pool } from './db/pool.js'

// Where the rate limits (limits.js) keep their counts: the rate_limits table
// (migration 008), so every copy of the API shares them. On Vercel several
// copies run at once and each is paused between requests; counts kept in
// memory would be split between them and forgotten.
//
// One store per limit; `name` keeps their counts apart ("device", "jobs"…).

// The visitor's internet address (or account id) is scrambled before it's
// stored, so the table never holds anyone's address. The scrambling uses a
// secret that every copy of the API already has (the database address), so
// the same visitor always gets the same code, and without the secret the
// code can't be turned back into the address.
function scramble(value) {
  return createHmac('sha256', process.env.DATABASE_URL).update(value).digest('hex').slice(0, 32)
}

// How often a copy of the API clears out counts whose time is up.
const CLEAN_EVERY_MS = 60 * 1000

export class PostgresStore {
  // Counts in this store affect every copy of the API, not just this one.
  localKeys = false

  constructor(name) {
    this.prefix = `${name}:`
    this.lastCleaned = 0
  }

  init(options) {
    this.windowSeconds = options.windowMs / 1000
  }

  key(value) {
    return this.prefix + scramble(value)
  }

  // One request more. In one step, the database either starts a new count
  // (first request, or the last count's time is up) or adds one to the
  // running count, and says where it stands.
  async increment(value) {
    this.cleanUpNow()
    const { rows } = await pool.query(
      `INSERT INTO rate_limits AS r (key, hits, reset_at)
       VALUES ($1, 1, now() + make_interval(secs => $2::double precision))
       ON CONFLICT (key) DO UPDATE SET
         hits     = CASE WHEN r.reset_at <= now() THEN 1 ELSE r.hits + 1 END,
         reset_at = CASE WHEN r.reset_at <= now() THEN EXCLUDED.reset_at ELSE r.reset_at END
       RETURNING hits, reset_at`,
      [this.key(value), this.windowSeconds],
    )
    return { totalHits: rows[0].hits, resetTime: rows[0].reset_at }
  }

  async get(value) {
    const { rows } = await pool.query(
      'SELECT hits, reset_at FROM rate_limits WHERE key = $1 AND reset_at > now()',
      [this.key(value)],
    )
    return rows[0] ? { totalHits: rows[0].hits, resetTime: rows[0].reset_at } : undefined
  }

  async decrement(value) {
    await pool.query(
      'UPDATE rate_limits SET hits = GREATEST(hits - 1, 0) WHERE key = $1 AND reset_at > now()',
      [this.key(value)],
    )
  }

  async resetKey(value) {
    await pool.query('DELETE FROM rate_limits WHERE key = $1', [this.key(value)])
  }

  // Delete counts whose time is up, at most once a minute per copy. It runs
  // alongside the request instead of making it wait; if it fails, the next
  // one tries again.
  cleanUpNow() {
    const now = Date.now()
    if (now - this.lastCleaned < CLEAN_EVERY_MS) return
    this.lastCleaned = now
    pool
      .query('DELETE FROM rate_limits WHERE reset_at < now()')
      .catch((error) => console.error('Clearing old rate-limit counts failed:', error.message))
  }
}
