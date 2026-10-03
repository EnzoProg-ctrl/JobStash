// The data-access layer.
//
// Every query is parameterised: values go in the array, never into the string.
// This is the single most important habit in database code, and it is what
// stops "'; DROP TABLE saved_jobs; --" in a form field from being a real
// problem.
//
// Every query also names the user, as `AND user_id = $n` inside the query
// itself, not as an `if` in the route. So someone else's job simply isn't
// found: a request for it gets the same 404 as a job that doesn't exist, and
// reveals nothing about whether it does.

export async function getAll(pool, userId, { status } = {}) {
  // $2 IS NULL means "no filter asked for", which keeps this parameterised.
  const result = await pool.query(
    `SELECT * FROM saved_jobs
     WHERE user_id = $1 AND ($2::text IS NULL OR status = $2)
     ORDER BY added_at DESC`,
    [userId, status ?? null]
  )
  return result.rows
}

export async function getById(pool, userId, id) {
  const result = await pool.query(
    'SELECT * FROM saved_jobs WHERE id = $1 AND user_id = $2',
    [id, userId]
  )
  return result.rows[0] ?? null
}

// The most jobs one account can keep. Far more than anyone job hunting needs,
// and it means My Stash can always load the whole list in one go.
export const MAX_JOBS = 1000

// Returns null when the account already has MAX_JOBS jobs. The count and the
// insert are one query, so there's no gap between checking and saving.
export async function create(pool, userId, { company_name, job_title, posting_url, status, outcome, favorite }) {
  const result = await pool.query(
    `INSERT INTO saved_jobs (user_id, company_name, job_title, posting_url, status, outcome, favorite)
     SELECT $1::uuid, $2::text, $3::text, $4::text, $5::text, $7::text, $8::boolean
     WHERE (SELECT count(*) FROM saved_jobs WHERE user_id = $1::uuid) < $6
     RETURNING *`,
    [userId, company_name, job_title ?? '', posting_url, status ?? 'to_apply', MAX_JOBS, outcome ?? null, favorite ?? false]
  )
  return result.rows[0] ?? null
}

export async function update(pool, userId, id, { company_name, job_title, posting_url, status, outcome, favorite }) {
  const result = await pool.query(
    `UPDATE saved_jobs
     SET company_name = $1, job_title = $2, posting_url = $3, status = $4, outcome = $7,
         favorite = COALESCE($8::boolean, favorite)
     WHERE id = $5 AND user_id = $6
     RETURNING *`,
    [company_name, job_title ?? '', posting_url, status, id, userId, outcome ?? null, favorite ?? null]
  )
  return result.rows[0] ?? null
}

// Marking a job (done, accepted, rejected, back to to apply) is the commonest
// write in the app: one tap on a card. It gets its own query so the client
// does not have to send the whole row back. server.js has already checked that
// status and outcome agree; the database checks again (migration 003).
export async function setStatus(pool, userId, id, status, outcome = null) {
  const result = await pool.query(
    `UPDATE saved_jobs
     SET status = $1, outcome = $2
     WHERE id = $3 AND user_id = $4
     RETURNING *`,
    [status, outcome, id, userId]
  )
  return result.rows[0] ?? null
}

export async function remove(pool, userId, id) {
  const result = await pool.query(
    'DELETE FROM saved_jobs WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  )
  return result.rowCount > 0
}

// Starring or unstarring a job (the ☆ on a card). Only for the owner, like
// every query here.
export async function setFavorite(pool, userId, id, favorite) {
  const result = await pool.query(
    `UPDATE saved_jobs
     SET favorite = $1
     WHERE id = $2 AND user_id = $3
     RETURNING *`,
    [favorite, id, userId]
  )
  return result.rows[0] ?? null
}
