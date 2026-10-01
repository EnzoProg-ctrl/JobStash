// One line per request, so you can see what the API is doing and spot
// problems, without the log itself becoming a privacy problem:
//
//   2026-10-01T09:14:03.112Z GET /api/jobs 200 34ms
//   2026-10-01T09:14:05.870Z PATCH /api/jobs/:id 200 41ms
//
// What it leaves out, on purpose: sign-in passes and other headers, anything
// sent in a request (job links, company names), who the person is, and the
// query string. Job numbers in addresses become :id, so the log can't be used
// to work out whose job is whose.

// /api/jobs/42 -> /api/jobs/:id. Any other part with a digit in it is hidden
// too, and very long addresses are cut short, since anyone can send any
// address and it all ends up in the log.
function safePath(request) {
  const path = request.originalUrl.split('?')[0]
    .replace(/^\/api\/jobs\/[^/]+/, '/api/jobs/:id')
    .split('/')
    .map((part) => (/\d/.test(part) ? ':id' : part))
    .join('/')
  return path.length > 100 ? `${path.slice(0, 100)}…` : path
}

export function logRequests(request, response, next) {
  // The website's CORS checks and a host's health checks happen all the time
  // and tell you nothing, so they are left out.
  if (request.method === 'OPTIONS' || request.path === '/healthz') return next()

  const started = process.hrtime.bigint()
  response.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - started) / 1e6
    const line = `${new Date().toISOString()} ${request.method} ${safePath(request)} ${response.statusCode} ${Math.round(ms)}ms`
    // Server errors go to the error log, where hosts make them easy to find.
    if (response.statusCode >= 500) console.error(line)
    else console.log(line)
  })
  next()
}
