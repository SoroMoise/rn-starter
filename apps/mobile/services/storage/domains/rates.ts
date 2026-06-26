import type { ExchangeRate } from '@/types'
import { crashlyticsService } from '@/services/api/crashlyticsService'
import { mmkv } from '../mmkv'
import { KEYS } from '../keys'

export const ratesStorage = {
  get(): ExchangeRate | null {
    const raw = mmkv.getString(KEYS.OFFLINE_RATES)
    if (!raw) return null

    try {
      const data = JSON.parse(raw) as Record<string, unknown>
      if (
        typeof data.base !== 'string' ||
        typeof data.rates !== 'object' ||
        data.rates === null ||
        typeof data.timestamp !== 'number' ||
        typeof data.lastUpdated !== 'string'
      ) {
        return null
      }

      const rawRates = data.rates as Record<string, unknown>
      const validatedRates: Record<string, number> = {}
      for (const [k, v] of Object.entries(rawRates)) {
        if (typeof v === 'number' && Number.isFinite(v) && v > 0) {
          validatedRates[k] = v
        }
      }
      if (Object.keys(validatedRates).length === 0) return null

      return {
        base: data.base,
        rates: validatedRates,
        timestamp: data.timestamp,
        lastUpdated: new Date(data.lastUpdated),
      }
    } catch (err) {
      crashlyticsService.recordError(
        err instanceof Error ? err : new Error('ratesStorage.get parse failed'),
        { source: 'storage.rates.get' }
      )
      return null
    }
  },

  set(rates: ExchangeRate): void {
    const data = {
      base: rates.base,
      rates: rates.rates,
      timestamp: rates.timestamp,
      lastUpdated: rates.lastUpdated.toISOString(),
    }
    mmkv.set(KEYS.OFFLINE_RATES, JSON.stringify(data))
  },

  getInitialDataLoaded(): boolean {
    return mmkv.getString(KEYS.INITIAL_DATA_LOADED) === 'true'
  },

  setInitialDataLoaded(v: boolean): void {
    mmkv.set(KEYS.INITIAL_DATA_LOADED, v.toString())
  },
}
