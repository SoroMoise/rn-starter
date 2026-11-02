import { createMiddleware } from 'hono/factory'
import type { Env } from '../types'

export const rateLimiter = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP')
  if (!ip) return next()

  let success = true
  try {
    ;({ success } = await c.env.API_RATE_LIMITER.limit({ key: ip }))
  } catch {}

  if (!success) {
    c.header('Retry-After', '60')
    return c.json({ error: 'Too many requests' }, 429)
  }

  return next()
})
