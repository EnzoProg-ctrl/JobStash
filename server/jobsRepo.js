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

export async function create(pool, userId, { company_name, job_title, posting_url, status }) {
  const result = await pool.query(
    `INSERT INTO saved_jobs (user_id, company_name, job_title, posting_url, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, company_name, job_title ?? '', posting_url, status ?? 'to_apply']
  )
  return result.rows[0]
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
