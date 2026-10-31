// Save a copy of every saved job to a file on this computer.
//
//   npm run db:backup
//
// Supabase's free plan keeps no backups you can restore, so this is the
// backup. Run it now and then (weekly is a good habit). It only reads: the
// database is never changed.
//
// Each file holds every job, every column, plus which account each belongs to
// (the account's id and email). The emails matter: if the database ever had
// to be rebuilt, the accounts would be new ones, and the email is how each
// job finds its owner again.
//
// The files are private data (people's emails and job links). They go in
// a "backups" folder next to this project, outside the repository, so they
// can't be pushed to GitHub by accident (.gitignore blocks them too). Set
// BACKUP_DIR to keep them somewhere else, e.g. an external drive.
//
// It needs the database owner's address in server/.env (the postgres one, as
// for migrations): the app's own account (jobstash_app) can't read the list
// of accounts.

import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from './pool.js'

const here = path.dirname(fileURLToPath(import.meta.url))
// server/db -> server -> the repository -> the folder around it.
const folder = path.resolve(process.env.BACKUP_DIR || path.join(here, '..', '..', '..', 'backups'))

// "2026-11-01-0930", in this computer's own time, so files sort by date.
function stamp(date = new Date()) {
  const two = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}-${two(date.getHours())}${two(date.getMinutes())}`
}

try {
  const client = await pool.connect()
  let jobs, accounts, migrations
  try {
    // One consistent picture: all three read at the same moment.
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
    jobs = (await client.query('SELECT * FROM saved_jobs ORDER BY id')).rows
    accounts = (await client.query(
      `SELECT id, email, created_at FROM auth.users
       WHERE id IN (SELECT DISTINCT user_id FROM saved_jobs WHERE user_id IS NOT NULL)
       ORDER BY created_at`,
    )).rows
    migrations = (await client.query('SELECT name FROM schema_migrations ORDER BY name')).rows.map((row) => row.name)
    await client.query('COMMIT')
  } finally {
    client.release()
  }

  const backup = {
    what: 'JobStash backup: every saved job, and the account (id, email) each belongs to',
    taken_at: new Date().toISOString(),
    database_version: migrations.at(-1) ?? null,
    counts: { jobs: jobs.length, accounts: accounts.length },
    accounts,
    jobs,
  }

  mkdirSync(folder, { recursive: true })
  const file = path.join(folder, `jobstash-backup-${stamp()}.json`)
  writeFileSync(file, JSON.stringify(backup, null, 1), { encoding: 'utf8', flag: 'wx' })
  console.log(`Saved ${jobs.length} jobs from ${accounts.length} accounts to ${file}`)
  console.log('This file holds people\'s emails and job links: keep it private, and never commit or share it.')
} catch (error) {
  if (/permission denied/i.test(error.message)) {
    console.error('Backup failed: this database account can\'t read everything. Use the owner (postgres) address in server/.env, as for migrations.')
  } else {
    console.error(`Backup failed: ${error.message}`)
  }
  process.exitCode = 1
} finally {
  await pool.end()
}
