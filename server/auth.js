// Who is making this request?
//
// The website signs people in with Google through Supabase Auth, which hands
// the browser a sign-in pass: a JWT, signed by Supabase. The website sends it
// on every request as `Authorization: Bearer <pass>`. This checks the
// signature against Supabase's PUBLIC keys, so the server holds no secret at
// all, and then trusts the user id inside it.
//
// The user id only ever comes from a verified pass, never from anything else
// the browser sends, so nobody can ask for someone else's jobs.

import { createRemoteJWKSet, jwtVerify } from 'jose'

// Fail at boot with one clear line, like DATABASE_URL in db/pool.js.
if (!process.env.SUPABASE_URL) {
  console.error(
    'SUPABASE_URL is not set. Locally: add it to .env (see .env.example). ' +
    'On a host: add it in the dashboard, then redeploy.'
  )
  process.exit(1)
}

const issuer = `${process.env.SUPABASE_URL.replace(/\/+$/, '')}/auth/v1`

// jose downloads the public keys once, keeps them, and only fetches again if
// Supabase starts signing with a new key.
const publicKeys = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`))

// Errors that mean "this pass is no good" (the visitor should sign in again),
// as opposed to "we couldn't reach Supabase to check it" (our problem).
const BAD_PASS = new Set([
  'ERR_JWT_EXPIRED',
  'ERR_JWT_INVALID',
  'ERR_JWT_CLAIM_VALIDATION_FAILED',
  'ERR_JWS_INVALID',
  'ERR_JWS_SIGNATURE_VERIFICATION_FAILED',
  'ERR_JWKS_NO_MATCHING_KEY',
  'ERR_JOSE_ALG_NOT_ALLOWED',
])

export async function requireUser(request, response, next) {
  const [scheme, pass] = (request.get('authorization') ?? '').split(' ')

  if (scheme !== 'Bearer' || !pass) {
    return response.status(401).json({ error: 'Sign in required' })
  }

  try {
    const { payload } = await jwtVerify(pass, publicKeys, {
      issuer,                     // made by YOUR Supabase project
      audience: 'authenticated',  // for a signed-in user, not the anonymous key
      algorithms: ['ES256', 'RS256'],
    })
    if (typeof payload.sub !== 'string') throw Object.assign(new Error('no user id'), { code: 'ERR_JWT_INVALID' })

    request.userId = payload.sub
    next()
  } catch (error) {
    if (BAD_PASS.has(error.code)) {
      return response.status(401).json({ error: "Your sign-in isn't valid or has expired. Please sign in again." })
    }
    console.error('Could not check a sign-in pass:', error.message)
    response.status(503).json({ error: "Couldn't check your sign-in right now. Please try again." })
  }
}
