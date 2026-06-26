import type { ExchangeRateResponse } from '@repo/shared/types/api'

export interface RateLimiterBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>
}

export interface Env {
  RATE_CACHE: KVNamespace
  API_RATE_LIMITER: RateLimiterBinding
  EXCHANGE_RATE_API_KEY: string
  API_KEY: string
  CACHE_TTL_SECONDS: string
  ALERTS_KV: KVNamespace
  FIREBASE_PRIVATE_KEY: string
  FIREBASE_CLIENT_EMAIL: string
  FIREBASE_PROJECT_ID: string
}

export interface CachedRates extends ExchangeRateResponse {
  cachedAt: number
}

export interface CachedHistoricalPoint {
  rate: number
  fetchedAt: number // unix seconds
}

export interface CachedHistoricalDay {
  rates: Record<string, number>
  fetchedAt: number // unix seconds
}
