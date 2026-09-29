// Run a .sql file against DATABASE_URL.
//
//   node --env-file=.env db/run.js db/schema.sql
//
// This exists instead of a psql command in package.json so the same script
// works on macOS, Windows, Linux and a Codespace, and so you do not need the
// PostgreSQL client tools installed to set up the database.

import { readFileSync } from 'node:fs'
import { pool } from './pool.js'

const file = process.argv[2]

if (!file) {
  console.error('usage: node --env-file=.env db/run.js <file.sql>')
  process.exit(1)
}

// This runs seed.sql, which empties the table first. That's fine on a laptop
// and would wipe every real user's jobs on the live database, so it refuses
// there. Schema changes go through `npm run db:migrate` instead.
if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to run SQL files with NODE_ENV=production. Use npm run db:migrate for schema changes.')
  process.exit(1)
}

try {
  await pool.query(readFileSync(file, 'utf8'))
  console.log(`ran ${file}`)
} catch (error) {
  console.error(`failed on ${file}: ${error.message}`)
  process.exitCode = 1
} finally {
  await pool.end()
}
