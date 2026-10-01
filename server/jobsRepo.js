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
export async function create(pool, userId, { company_name, job_title, posting_url, status }) {
  const result = await pool.query(
    `INSERT INTO saved_jobs (user_id, company_name, job_title, posting_url, status)
     SELECT $1::uuid, $2::text, $3::text, $4::text, $5::text
     WHERE (SELECT count(*) FROM saved_jobs WHERE user_id = $1::uuid) < $6
     RETURNING *`,
    [userId, company_name, job_title ?? '', posting_url, status ?? 'to_apply', MAX_JOBS]
  )
  return result.rows[0] ?? null
}

export async function update(pool, userId, id, { company_name, job_title, posting_url, status }) {
  const result = await pool.query(
    `UPDATE saved_jobs
     SET company_name = $1, job_title = $2, posting_url = $3, status = $4
     WHERE id = $5 AND user_id = $6
     RETURNING *`,
    [company_name, job_title ?? '', posting_url, status, id, userId]
  )
  return result.rows[0] ?? null
}

// The status toggle is the commonest write in the app: one tap on a card. It
// gets its own query so the client does not have to send the whole row back
// just to tick a box.
export async function setStatus(pool, userId, id, status) {
  const result = await pool.query(
    `UPDATE saved_jobs
     SET status = $1
     WHERE id = $2 AND user_id = $3
     RETURNING *`,
    [status, id, userId]
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
