import type {
  CreateAlertRequest,
  RateAlert,
  ThresholdRateAlert,
  VariationRateAlert,
} from '@repo/shared/types/api'
import { Hono } from 'hono'
import type { Env } from '../types'
import { normalizeAlertFromKV } from '../utils/alertNormalize'

const alerts = new Hono<{ Bindings: Env }>()

// RevenueCat app user IDs are opaque tokens (e.g. "$RCAnonymousID:<32 hex>").
// This format gate rejects junk and keeps KV keys well-formed; it is NOT an
// authentication of the caller (see plan's out-of-scope note).
const CUSTOMER_ID_RE = /^[A-Za-z0-9$:_.-]{1,128}$/

type AlertIdentity = {
  id: string
  rcCustomerId: string
  createdAt: string
  isActive: boolean
}

// Validates a create/update body and assembles the stored alert. Shared by POST
// (fresh identity) and PATCH (identity carried over from the existing record) so
// validation and shape stay in lockstep across both routes.
function buildAlert(
  identity: AlertIdentity,
  body: CreateAlertRequest
): { alert: RateAlert } | { error: string } {
  if (!body.fromCurrency || !body.toCurrency) return { error: 'invalid_body' }

  const fromCurrency = body.fromCurrency.toUpperCase()
  const toCurrency = body.toCurrency.toUpperCase()

  if (body.triggerType === 'variation') {
    if (
      typeof body.variationPercent !== 'number' ||
      body.variationPercent <= 0 ||
      body.variationPercent > 50
    ) {
      return { error: 'invalid_variation_percent' }
    }
    if (typeof body.baselineRate !== 'number' || body.baselineRate <= 0) {
      return { error: 'invalid_baseline_rate' }
    }
    const variationAlert: VariationRateAlert = {
      ...identity,
      fromCurrency,
      toCurrency,
      triggerType: 'variation',
      variationPercent: body.variationPercent,
      baselineRate: body.baselineRate,
    }
    return { alert: variationAlert }
  }

  if (body.direction !== 'above' && body.direction !== 'below') {
    return { error: 'invalid_direction' }
  }
  if (typeof body.targetRate !== 'number' || body.targetRate <= 0) {
    return { error: 'invalid_target_rate' }
  }
  const thresholdAlert: ThresholdRateAlert = {
    ...identity,
    fromCurrency,
    toCurrency,
    triggerType: 'threshold',
    direction: body.direction,
    targetRate: body.targetRate,
  }
  return { alert: thresholdAlert }
}

alerts.use('*', async (c, next) => {
  const rcCustomerId = c.req.header('x-rc-customer-id')

  if (!rcCustomerId) return c.json({ error: 'missing_customer_id' }, 400)
  if (!CUSTOMER_ID_RE.test(rcCustomerId)) return c.json({ error: 'invalid_customer_id' }, 400)

  await next()
})

alerts.post('/token', async (c) => {
  const rcCustomerId = c.req.header('x-rc-customer-id')!

  const body = await c.req.json<{ token?: string }>()
  if (!body.token) return c.json({ error: 'missing_token' }, 400)

  await c.env.ALERTS_KV.put(`user-fcm-token:${rcCustomerId}`, body.token)

  return c.json({ ok: true })
})

alerts.get('/', async (c) => {
  const rcCustomerId = c.req.header('x-rc-customer-id')!
  const indexRaw = await c.env.ALERTS_KV.get(`user-alerts:${rcCustomerId}`)
  const alertIds: string[] = indexRaw ? (JSON.parse(indexRaw) as string[]) : []

  const resolved = await Promise.all(
    alertIds.map(async (id) => {
      const raw = await c.env.ALERTS_KV.get(`alert:${id}`)
      if (!raw) return { id, alert: null as RateAlert | null }
      try {
        return { id, alert: normalizeAlertFromKV(JSON.parse(raw)) }
      } catch {
        return { id, alert: null as RateAlert | null }
      }
    })
  )

  const valid = resolved.filter((r): r is { id: string; alert: RateAlert } => r.alert !== null)

  if (valid.length !== alertIds.length) {
    await c.env.ALERTS_KV.put(`user-alerts:${rcCustomerId}`, JSON.stringify(valid.map((r) => r.id)))
  }

  return c.json(valid.map((r) => r.alert))
})

alerts.post('/', async (c) => {
  const rcCustomerId = c.req.header('x-rc-customer-id')!
  const indexRaw = await c.env.ALERTS_KV.get(`user-alerts:${rcCustomerId}`)
  const alertIds: string[] = indexRaw ? (JSON.parse(indexRaw) as string[]) : []

  const body = await c.req.json<CreateAlertRequest>()
  const id = crypto.randomUUID()
  const result = buildAlert(
    { id, rcCustomerId, createdAt: new Date().toISOString(), isActive: true },
    body
  )
  if ('error' in result) return c.json({ error: result.error }, 400)
  const alert = result.alert

  await Promise.all([
    c.env.ALERTS_KV.put(`alert:${id}`, JSON.stringify(alert)),
    c.env.ALERTS_KV.put(`user-alerts:${rcCustomerId}`, JSON.stringify([...alertIds, id])),
  ])

  return c.json(alert, 201)
})

alerts.patch('/:id', async (c) => {
  const rcCustomerId = c.req.header('x-rc-customer-id')!
  const alertId = c.req.param('id')

  const existingRaw = await c.env.ALERTS_KV.get(`alert:${alertId}`)
  if (!existingRaw) return c.json({ error: 'not_found' }, 404)

  let existing: RateAlert | null = null
  try {
    existing = normalizeAlertFromKV(JSON.parse(existingRaw))
  } catch {
    return c.json({ error: 'not_found' }, 404)
  }
  if (!existing) return c.json({ error: 'not_found' }, 404)
  if (existing.rcCustomerId !== rcCustomerId) return c.json({ error: 'forbidden' }, 403)

  const body = await c.req.json<CreateAlertRequest>()
  const result = buildAlert(
    {
      id: existing.id,
      rcCustomerId: existing.rcCustomerId,
      createdAt: existing.createdAt,
      isActive: existing.isActive,
    },
    body
  )
  if ('error' in result) return c.json({ error: result.error }, 400)

  await c.env.ALERTS_KV.put(`alert:${alertId}`, JSON.stringify(result.alert))

  return c.json(result.alert)
})

alerts.delete('/:id', async (c) => {
  const rcCustomerId = c.req.header('x-rc-customer-id')!
  const alertId = c.req.param('id')

  const alertRaw = await c.env.ALERTS_KV.get(`alert:${alertId}`)
  if (!alertRaw) return c.json({ error: 'not_found' }, 404)
  let parsed: { rcCustomerId?: unknown } | null = null
  try {
    parsed = JSON.parse(alertRaw)
  } catch {
    return c.json({ error: 'not_found' }, 404)
  }
  if (!parsed || parsed.rcCustomerId !== rcCustomerId) return c.json({ error: 'forbidden' }, 403)

  const indexRaw = await c.env.ALERTS_KV.get(`user-alerts:${rcCustomerId}`)
  const alertIds: string[] = indexRaw ? (JSON.parse(indexRaw) as string[]) : []

  await Promise.all([
    c.env.ALERTS_KV.delete(`alert:${alertId}`),
    c.env.ALERTS_KV.put(
      `user-alerts:${rcCustomerId}`,
      JSON.stringify(alertIds.filter((id) => id !== alertId))
    ),
  ])

  return c.json({ ok: true })
})

export { alerts }
