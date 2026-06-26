import type { ExchangeRateResponse } from '@repo/shared/types/api'
import { Hono } from 'hono'
import type { Context } from 'hono'
import { UnsupportedCurrencyError, fetchFromExchangeRateApi } from '../services/exchangeRate'
import type { CachedRates, Env } from '../types'
import { isSupportedCurrency } from '../utils/supportedCurrencies'

const rates = new Hono<{ Bindings: Env }>()

// KV caps writes at ~1/s/key: when several isolates cache-miss the same base
// simultaneously, the losing puts must never turn a successful upstream fetch
// into an error response. The put is detached from the response path.
function cacheFresh(c: Context<{ Bindings: Env }>, cacheKey: string, fresh: ExchangeRateResponse) {
  const toCache: CachedRates = { ...fresh, cachedAt: Math.floor(Date.now() / 1000) }
  const put = c.env.RATE_CACHE.put(cacheKey, JSON.stringify(toCache)).catch(() => {})
  try {
    c.executionCtx.waitUntil(put)
  } catch {
    // No ExecutionContext outside Workers (tests): the floating put settles on its own.
  }
}

rates.get('/:base', async (c) => {
  const base = c.req.param('base').toUpperCase()

  if (!/^[A-Z]{3}$/.test(base)) {
    return c.json({ error: 'Invalid currency code' }, 400)
  }

  if (!isSupportedCurrency(base)) {
    return c.json({ error: 'Unsupported currency code' }, 404)
  }

  const ttl = parseInt(c.env.CACHE_TTL_SECONDS || '3600', 10)

  const cacheKey = `rates:${base}`
  const cached = await c.env.RATE_CACHE.get<CachedRates>(cacheKey, 'json')

  if (cached) {
    const age = Math.floor(Date.now() / 1000) - cached.cachedAt
    if (age < ttl) {
      return c.json({
        base: cached.base,
        rates: cached.rates,
        timestamp: cached.timestamp,
        lastUpdated: cached.lastUpdated,
      })
    }

    try {
      const fresh = await fetchFromExchangeRateApi(c.env.EXCHANGE_RATE_API_KEY, base)
      cacheFresh(c, cacheKey, fresh)
      return c.json(fresh)
    } catch (err) {
      if (err instanceof UnsupportedCurrencyError) {
        return c.json({ error: 'Unsupported currency code' }, 404)
      }
      c.header('X-Cache-Stale', 'true')
      return c.json({
        base: cached.base,
        rates: cached.rates,
        timestamp: cached.timestamp,
        lastUpdated: cached.lastUpdated,
      })
    }
  }

  try {
    const fresh = await fetchFromExchangeRateApi(c.env.EXCHANGE_RATE_API_KEY, base)
    cacheFresh(c, cacheKey, fresh)
    return c.json(fresh)
  } catch (err) {
    if (err instanceof UnsupportedCurrencyError) {
      return c.json({ error: 'Unsupported currency code' }, 404)
    }
    return c.json({ error: 'Service unavailable' }, 503)
  }
})

export { rates }
