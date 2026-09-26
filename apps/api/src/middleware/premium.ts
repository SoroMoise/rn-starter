import { createMiddleware } from 'hono/factory'
import { EntitlementUnavailableError, isPremiumCustomer } from '../services/revenueCatService'
import type { Env } from '../types'

export type EntitlementVariables = { rcCustomerId: string; isPremium: boolean }

// RevenueCat app user ids are opaque ("$RCAnonymousID:" and 32 hex digits). This rejects junk and
// keeps the cache keys well formed; it does NOT authenticate the caller. The app's API key ships in
// the APK, so anyone can send any id: what protects a subscriber is that theirs cannot be guessed.
const CUSTOMER_ID_RE = /^[A-Za-z0-9$:_.-]{1,128}$/

// Resolves the caller's tier once and hands it to the route, which decides what a free caller
// gets: a refusal, or an allowance of its own.
export const entitlementContext = createMiddleware<{
  Bindings: Env
  Variables: EntitlementVariables
}>(async (c, next) => {
  const rcCustomerId = c.req.header('x-rc-customer-id')
  if (!rcCustomerId || !CUSTOMER_ID_RE.test(rcCustomerId)) {
    return c.json({ error: 'invalid_customer_id' }, 400)
  }

  try {
    c.set('rcCustomerId', rcCustomerId)
    c.set('isPremium', await isPremiumCustomer({ rcCustomerId, env: c.env }))
  } catch (err) {
    if (err instanceof EntitlementUnavailableError) {
      return c.json({ error: 'entitlement_check_unavailable' }, 503)
    }
    throw err
  }

  await next()
})
