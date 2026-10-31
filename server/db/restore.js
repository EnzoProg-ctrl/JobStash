// Put jobs back from a backup made by npm run db:backup.
//
//   npm run db:restore                          rehearse with the newest backup
//   npm run db:restore -- path/to/backup.json   rehearse with that backup
//   npm run db:restore -- --email someone@x.com only that account's jobs
//   npm run db:restore -- --yes                 really put them back
//
// What it does, and doesn't:
// - It only puts back jobs that are missing. A job still in the database
//   (same number) is left exactly as it is, never overwritten. Nothing is
//   ever deleted.
// - Each job goes back to its owner: the same account if it still exists,
//   or the account with the same email (if the account was made again after
//   the database was rebuilt). If neither exists, the account is gone (for
//   example deleted at the person's request), and its jobs stay out.
// - Without --yes it's a rehearsal: everything is done inside the database,
//   checked by it, counted, and then undone. With --yes the same is kept.
//
// Be aware: jobs that people deleted themselves after the backup was taken
// are "missing" too, and would come back. Use the backup from just before the
// loss, and --email to put back one person's jobs only.
//
// Emails in the output are masked (c•••@gmail.com), so a screenshot of the
// terminal doesn't show them. It needs the owner's (postgres) address in
// server/.env, as for migrations and backups.

import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from './pool.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const backupFolder = path.resolve(process.env.BACKUP_DIR || path.join(here, '..', '..', '..', 'backups'))

const args = process.argv.slice(2)
const really = args.includes('--yes')
const emailIndex = args.indexOf('--email')
const onlyEmail = emailIndex >= 0 ? (args[emailIndex + 1] ?? '').trim().toLowerCase() : null
// The backup file: the one argument that isn't a --switch or the --email address.
const fileArg = args.find((arg, i) => !arg.startsWith('--') && (emailIndex < 0 || i !== emailIndex + 1))

function mask(email) {
  if (!email) return '(no email)'
  const [name, domain] = email.split('@')
  return `${name.slice(0, 1)}•••@${domain ?? ''}`
}

function newestBackup() {
  let names
  try {
    names = readdirSync(backupFolder).filter((name) => /^jobstash-backup-.*\.json$/.test(name)).sort()
  } catch {
    names = []
  }
  if (!names.length) throw new Error(`No backups in ${backupFolder}. Run npm run db:backup first, or give the file's path.`)
  return path.join(backupFolder, names.at(-1))
}

let exitCode = 0
try {
  if (emailIndex >= 0 && !onlyEmail) throw new Error('--email needs an address after it.')
  const file = path.resolve(fileArg ?? newestBackup())
  const backup = JSON.parse(readFileSync(file, 'utf8'))
  if (!Array.isArray(backup.jobs) || !Array.isArray(backup.accounts)) {
    throw new Error(`${file} doesn't look like a JobStash backup.`)
  }
  console.log(`Backup: ${file}`)
  console.log(`  taken ${backup.taken_at}, ${backup.jobs.length} jobs from ${backup.accounts.length} accounts`)
  if (onlyEmail) console.log(`  only the jobs of ${mask(onlyEmail)}`)

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Which columns the table has today, so a backup from an older or newer
    // version still fits: only the columns both know are copied.
    const columns = (await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'saved_jobs'",
    )).rows.map((row) => row.column_name)

    // Each backed-up account, matched to an account that exists now.
    const backupEmail = new Map(backup.accounts.map((account) => [account.id, account.email]))
    const current = (await client.query('SELECT id, lower(email) AS email FROM auth.users')).rows
    const currentIds = new Set(current.map((row) => row.id))
    const idByEmail = new Map(current.map((row) => [row.email, row.id]))
    function ownerNow(oldId) {
      if (oldId === null || oldId === undefined) return { id: null }           // a sample job: no owner
      if (currentIds.has(oldId)) return { id: oldId }
      const email = (backupEmail.get(oldId) ?? '').toLowerCase()
      if (email && idByEmail.has(email)) return { id: idByEmail.get(email), movedFrom: oldId }
      return { gone: true }
    }

    const existing = new Set((await client.query('SELECT id FROM saved_jobs')).rows.map((row) => String(row.id)))
    const tally = { putBack: 0, alreadyThere: 0, ownerGone: 0, otherAccount: 0, toNewAccount: 0 }
    const perAccount = new Map()

    for (const job of backup.jobs) {
      const email = backupEmail.get(job.user_id) ?? null
      if (onlyEmail && (email ?? '').toLowerCase() !== onlyEmail) { tally.otherAccount++; continue }
      if (existing.has(String(job.id))) { tally.alreadyThere++; continue }
      const owner = ownerNow(job.user_id)
      if (owner.gone) { tally.ownerGone++; continue }

      const row = { ...job, user_id: owner.id }
      const keys = columns.filter((column) => column in row)
      await client.query(
        `INSERT INTO saved_jobs (${keys.join(', ')}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(', ')})`,
        keys.map((key) => row[key]),
      )
      tally.putBack++
      if (owner.movedFrom) tally.toNewAccount++
      const label = email ? mask(email.toLowerCase()) : '(sample jobs, no owner)'
      perAccount.set(label, (perAccount.get(label) ?? 0) + 1)
    }

    console.log('')
    console.log(`${really ? 'Putting back' : 'Would put back'}: ${tally.putBack} jobs`)
    for (const [label, count] of perAccount) console.log(`  ${count} for ${label}`)
    if (tally.toNewAccount) console.log(`  (${tally.toNewAccount} of them to an account made again with the same email)`)
    console.log(`Already in the database (left alone): ${tally.alreadyThere}`)
    console.log(`Owner's account no longer exists (left out): ${tally.ownerGone}`)
    if (onlyEmail) console.log(`Other accounts' jobs (left out, because of --email): ${tally.otherAccount}`)

    if (really) {
      // New jobs must get numbers above every restored one.
      await client.query(
        "SELECT setval('saved_jobs_id_seq', GREATEST((SELECT COALESCE(max(id), 1) FROM saved_jobs), (SELECT last_value FROM saved_jobs_id_seq)))",
      )
      await client.query('COMMIT')
      console.log('')
      console.log(tally.putBack ? 'Done: the jobs above are back.' : 'Nothing was missing; nothing changed.')
    } else {
      await client.query('ROLLBACK')
      console.log('')
      console.log('This was a rehearsal: the database checked it all, and nothing was kept.')
      if (tally.putBack) console.log('To really put them back, run it again with --yes.')
    }
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    throw error
  } finally {
    client.release()
  }
} catch (error) {
  console.error(`Restore stopped, nothing changed: ${error.message}`)
  exitCode = 1
} finally {
  await pool.end()
  process.exitCode = exitCode
}
