import { createMiddleware } from 'hono/factory'
import type { Env } from '../types'

// Cloudflare's native rate limiting binding (30 req / 60 s per IP, configured
// in wrangler.toml) replaces the previous KV counter: KV is neither atomic
// nor able to absorb more than ~1 write/s/key, which both let bursts through
// and returned 500s to legitimate clients.
export const rateLimiter = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  // Always present on requests proxied by Cloudflare; absent only in local
  // dev and tests, where limiting is skipped on purpose. X-Forwarded-For is
  // client-controlled and must never be used as an identity.
  const ip = c.req.header('CF-Connecting-IP')
  if (!ip) return next()

  let success = true
  try {
    ;({ success } = await c.env.API_RATE_LIMITER.limit({ key: ip }))
  } catch {
    // Fail open: a limiter outage must not take the whole API down.
  }

  if (!success) {
    c.header('Retry-After', '60')
    return c.json({ error: 'Too many requests' }, 429)
  }

  return next()
})
