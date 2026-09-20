// The data-access layer.
//
// Every query is parameterised: values go in the array, never into the string.
// This is the single most important habit in database code, and it is what
// stops "'; DROP TABLE saved_jobs; --" in a form field from being a real
// problem.

export async function getAll(pool, { status } = {}) {
  // One statement rather than two, so the filter cannot drift from the sort.
  // $1 IS NULL means "no filter asked for", which keeps this parameterised.
  const result = await pool.query(
    `SELECT * FROM saved_jobs
     WHERE $1::text IS NULL OR status = $1
     ORDER BY added_at DESC`,
    [status ?? null]
  )
  return result.rows
}

export async function getById(pool, id) {
  const result = await pool.query('SELECT * FROM saved_jobs WHERE id = $1', [id])
  return result.rows[0] ?? null
}

export async function create(pool, { company_name, job_title, posting_url, status }) {
  const result = await pool.query(
    `INSERT INTO saved_jobs (company_name, job_title, posting_url, status)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [company_name, job_title ?? '', posting_url, status ?? 'to_apply']
  )
  return result.rows[0]
}

export async function update(pool, id, { company_name, job_title, posting_url, status }) {
  const result = await pool.query(
    `UPDATE saved_jobs
     SET company_name = $1, job_title = $2, posting_url = $3, status = $4
     WHERE id = $5
     RETURNING *`,
    [company_name, job_title ?? '', posting_url, status, id]
  )
  return result.rows[0] ?? null
}

// The status toggle is the commonest write in the app: one tap on a card. It
// gets its own query so the client does not have to send the whole row back
// just to tick a box.
export async function setStatus(pool, id, status) {
  const result = await pool.query(
    `UPDATE saved_jobs
     SET status = $1
     WHERE id = $2
     RETURNING *`,
    [status, id]
  )
  return result.rows[0] ?? null
}

export async function remove(pool, id) {
  const result = await pool.query(
    'DELETE FROM saved_jobs WHERE id = $1 RETURNING id',
    [id]
  )
  return result.rowCount > 0
}
