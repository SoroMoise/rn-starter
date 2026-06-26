import type { HistoricalRatePoint } from '@repo/shared/types/api'
import { Hono } from 'hono'
import { assembleHistoricalRates, isValidPeriod } from '../services/historicalRates'
import type { Env } from '../types'
import { isSupportedCurrency } from '../utils/supportedCurrencies'

const history = new Hono<{ Bindings: Env }>()

history.get('/:base/history', async (c) => {
  const base = c.req.param('base').toUpperCase()
  const target = (c.req.query('target') ?? '').toUpperCase()

  if (!/^[A-Z]{3}$/.test(base)) return c.json({ error: 'Invalid base currency code' }, 400)
  if (!/^[A-Z]{3}$/.test(target))
    return c.json({ error: 'Invalid or missing target currency code' }, 400)
  if (!isSupportedCurrency(base) || !isSupportedCurrency(target))
    return c.json({ error: 'Unsupported currency code' }, 404)
  if (base === target) return c.json({ error: 'Base and target currencies must be different' }, 400)

  const daysRaw = c.req.query('days') ?? '30'
  if (!/^\d+$/.test(daysRaw)) {
    return c.json({ error: 'Invalid period. Allowed values: 7, 30, 90, 270, 365' }, 400)
  }
  const days = parseInt(daysRaw, 10)
  if (!isValidPeriod(days)) {
    return c.json({ error: 'Invalid period. Allowed values: 7, 30, 90, 270, 365' }, 400)
  }

  try {
    const rates = await assembleHistoricalRates(
      c.env.RATE_CACHE,
      c.env.EXCHANGE_RATE_API_KEY,
      base,
      target,
      days
    )
    const statistics = calculateStatistics(rates)

    c.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400')
    return c.json({ base, target, period: days, rates, statistics })
  } catch {
    return c.json({ error: 'Service unavailable' }, 503)
  }
})

function calculateStatistics(rates: HistoricalRatePoint[]) {
  if (rates.length === 0) {
    return { min: 0, max: 0, average: 0, variation: 0, currentRate: 0 }
  }

  const values = rates.map((r) => r.rate)

  const min = Math.min(...values)
  const max = Math.max(...values)

  const average = values.reduce((sum, v) => sum + v, 0) / values.length

  const currentRate = values[values.length - 1]
  const firstRate = values[0]
  const variation = firstRate !== 0 ? ((currentRate - firstRate) / firstRate) * 100 : 0

  return { min, max, average, variation, currentRate }
}

export { history }
