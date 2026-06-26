import type { RateAlert } from '@repo/shared/types/api'
import { isThresholdAlert, isVariationAlert } from '@repo/shared/types/api'
import { FCMError, sendFCMNotification } from '../services/fcmService'
import { fetchFromExchangeRateApi } from '../services/exchangeRate'
import type { Env } from '../types'
import { normalizeAlertFromKV } from '../utils/alertNormalize'

const DEAD_TOKEN_CODES = new Set(['UNREGISTERED', 'SENDER_ID_MISMATCH'])

export function calculateCrossRate(
  rates: Record<string, number>,
  from: string,
  to: string
): number | null {
  if (from === to) return 1
  if (from === 'USD') return rates[to] ?? null
  if (to === 'USD') {
    const r = rates[from]
    return r ? 1 / r : null
  }
  const f = rates[from]
  const t = rates[to]
  return f != null && t != null ? t / f : null
}

function evaluateTrigger(alert: RateAlert, currentRate: number): boolean {
  if (isThresholdAlert(alert)) {
    return (
      (alert.direction === 'above' && currentRate > alert.targetRate) ||
      (alert.direction === 'below' && currentRate < alert.targetRate)
    )
  }
  if (isVariationAlert(alert)) {
    if (alert.baselineRate <= 0) return false
    const deltaPercent = Math.abs((currentRate - alert.baselineRate) / alert.baselineRate) * 100
    return deltaPercent >= alert.variationPercent
  }
  return false
}

export async function handleCron(
  _event: ScheduledEvent,
  env: Env,
  _ctx: ExecutionContext
): Promise<void> {
  const ttl = parseInt(env.CACHE_TTL_SECONDS || '3600', 10)
  const maxStaleSeconds = 24 * 60 * 60

  const cached = (await env.RATE_CACHE.get('rates:USD', 'json')) as {
    rates: Record<string, number>
    cachedAt?: number
  } | null
  const nowSeconds = Math.floor(Date.now() / 1000)
  const age = cached?.cachedAt != null ? nowSeconds - cached.cachedAt : Number.POSITIVE_INFINITY

  let rates = cached?.rates ?? null
  if (!cached || age >= ttl) {
    try {
      const fresh = await fetchFromExchangeRateApi(env.EXCHANGE_RATE_API_KEY, 'USD')
      try {
        await env.RATE_CACHE.put(
          'rates:USD',
          JSON.stringify({ ...fresh, cachedAt: Math.floor(Date.now() / 1000) })
        )
      } catch {
        // KV write cap (~1/s/key): another writer just cached it — the
        // evaluation below still runs on the fresh in-memory rates.
      }
      rates = fresh.rates
    } catch {
      // Upstream down: stale rates beat skipping the run, but a >24h
      // snapshot would fire alerts on prices that no longer exist.
      if (!cached || age >= maxStaleSeconds) return
    }
  }
  if (!rates) return

  const resolvedRates = rates
  let cursor: string | undefined

  do {
    const list = await env.ALERTS_KV.list({ prefix: 'alert:', cursor, limit: 100 })
    cursor = list.list_complete ? undefined : (list as any).cursor

    await Promise.all(
      list.keys.map(async (key) => {
        const raw = await env.ALERTS_KV.get(key.name, 'json')
        const alert = normalizeAlertFromKV(raw)
        if (!alert || !alert.isActive) return

        // KV has no transactions: two concurrent POSTs can drop an id from
        // the user's index, leaving an alert that fires notifications but is
        // invisible and undeletable in the app. Re-attach such orphans here.
        try {
          const indexKey = `user-alerts:${alert.rcCustomerId}`
          const indexRaw = await env.ALERTS_KV.get(indexKey)
          const ids: string[] = indexRaw ? (JSON.parse(indexRaw) as string[]) : []
          if (!ids.includes(alert.id)) {
            await env.ALERTS_KV.put(indexKey, JSON.stringify([...ids, alert.id]))
          }
        } catch {
          // healing is best-effort; evaluation continues regardless
        }

        const currentRate = calculateCrossRate(resolvedRates, alert.fromCurrency, alert.toCurrency)
        if (currentRate === null) return

        if (!evaluateTrigger(alert, currentRate)) return

        const fcmToken = await env.ALERTS_KV.get(`user-fcm-token:${alert.rcCustomerId}`)
        if (!fcmToken) return

        try {
          await sendFCMNotification({
            token: fcmToken,
            fromCurrency: alert.fromCurrency,
            toCurrency: alert.toCurrency,
            currentRate,
            alertId: alert.id,
            triggerContext: isThresholdAlert(alert)
              ? {
                  type: 'threshold',
                  direction: alert.direction,
                  targetRate: alert.targetRate,
                }
              : {
                  type: 'variation',
                  variationPercent: alert.variationPercent,
                  baselineRate: alert.baselineRate,
                },
            projectId: env.FIREBASE_PROJECT_ID,
            clientEmail: env.FIREBASE_CLIENT_EMAIL,
            privateKeyPem: env.FIREBASE_PRIVATE_KEY,
          })
        } catch (err) {
          if (err instanceof FCMError && err.errorCode && DEAD_TOKEN_CODES.has(err.errorCode)) {
            await env.ALERTS_KV.delete(`user-fcm-token:${alert.rcCustomerId}`)
          }
          return
        }

        await env.ALERTS_KV.put(
          key.name,
          JSON.stringify({
            ...alert,
            isActive: false,
            triggeredAt: new Date().toISOString(),
            triggeredAtRate: currentRate,
          })
        )
      })
    )
  } while (cursor)
}
