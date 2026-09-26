import { Hono } from 'hono'
import { entitlementContext } from '../middleware/premium'
import type { Env } from '../types'

export const example = new Hono<{ Bindings: Env }>()

// Rate limit and API key are applied to the whole group in index.ts.
example.get('/', (c) => c.json({ message: 'authenticated', at: Date.now() }))

example.get('/premium', entitlementContext, (c) => {
  if (!c.get('isPremium')) return c.json({ error: 'premium_required' }, 403)
  return c.json({ message: 'premium', at: Date.now() })
})
