// Bring the database up to date, one numbered migration at a time.
//
//   npm run db:migrate
//
// Every file in db/migrations runs once, in name order, and is then recorded in
// schema_migrations so it never runs again. Each file runs inside a
// transaction: if any line fails, none of that file's changes are kept and
// nothing is recorded, so the database is never left half-changed.
//
// To change the database later, add the next file (003_...sql). Never edit a
// file that has already run on the live database; add a new one instead.

import { readdirSync, readFileSync } from 'node:fs'
import { pool } from './pool.js'

const folder = new URL('./migrations/', import.meta.url)
const files = readdirSync(folder).filter((name) => name.endsWith('.sql')).sort()

const client = await pool.connect()
try {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  // It lives next to saved_jobs, so Supabase's public API must not reach it
  // either (see 001).
  await client.query('ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY')

  // If two copies of the server start at once, only one runs the migrations;
  // the other waits here until it has finished.
  await client.query('SELECT pg_advisory_lock(20260929)')

  const applied = new Set(
    (await client.query('SELECT name FROM schema_migrations')).rows.map((row) => row.name)
  )

  let ran = 0
  for (const name of files) {
    if (applied.has(name)) continue
    try {
      await client.query('BEGIN')
      await client.query(readFileSync(new URL(name, folder), 'utf8'))
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name])
      await client.query('COMMIT')
      console.log(`applied ${name}`)
      ran++
    } catch (error) {
      await client.query('ROLLBACK')
      throw new Error(`${name} failed, nothing from it was kept: ${error.message}`)
    }
  }
  console.log(ran ? `${ran} migration(s) applied` : 'already up to date')
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  await client.query('SELECT pg_advisory_unlock(20260929)').catch(() => {})
  client.release()
  await pool.end()
}
