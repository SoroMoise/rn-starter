import type { HistoricalRate, Period, Statistics } from '@/types'
import { isValidCurrencyCode, isValidPeriod } from '@/utils/validators'
import { BACKEND_CONFIG } from '@constants/config'
import axios from 'axios'

if (!BACKEND_CONFIG.URL || !BACKEND_CONFIG.API_KEY) {
  throw new Error(
    'BACKEND_URL and BACKEND_API_KEY must be configured in .env and app.config.js extra'
  )
}

export interface HistoricalQueryParams {
  fromCurrency: string
  toCurrency: string
  period: Period
}

export interface HistoricalData {
  rates: HistoricalRate[]
  statistics: Statistics
}

interface HistoricalRatesApiResponse {
  base: string
  target: string
  period: number
  rates: { date: string; rate: number }[]
  statistics: Statistics
}

export async function fetchHistoricalRates({
  params,
  signal,
}: {
  params: HistoricalQueryParams
  signal: AbortSignal
}): Promise<HistoricalData> {
  if (!isValidCurrencyCode(params.fromCurrency)) {
    throw new Error(`Invalid source currency code: ${params.fromCurrency}`)
  }
  if (!isValidCurrencyCode(params.toCurrency)) {
    throw new Error(`Invalid target currency code: ${params.toCurrency}`)
  }
  if (!isValidPeriod(params.period)) {
    throw new Error(`Invalid period: ${params.period}. Allowed values: 7, 30, 90, 270, 365`)
  }

  const response = await axios.get<HistoricalRatesApiResponse>(
    `${BACKEND_CONFIG.URL}/rates/${params.fromCurrency}/history`,
    {
      params: { target: params.toCurrency, days: params.period },
      headers: { 'x-api-key': BACKEND_CONFIG.API_KEY },
      timeout: BACKEND_CONFIG.TIMEOUT,
      signal,
    }
  )

  return {
    rates: response.data.rates,
    statistics: response.data.statistics,
  }
}
