import { createMiddleware } from 'hono/factory'
import { EntitlementUnavailableError, isPremiumCustomer } from '../services/revenueCatService'
import type { Env } from '../types'

export type EntitlementVariables = { rcCustomerId: string; isPremium: boolean }

const CUSTOMER_ID_RE = /^[A-Za-z0-9$:_.-]{1,128}$/

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
