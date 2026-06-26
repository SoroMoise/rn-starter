import type { ExchangeRateResponse } from '@repo/shared/types/api'

interface ExchangeRateApiResponse {
  result: string
  base_code: string
  conversion_rates: Record<string, number>
  time_last_update_unix: number
  'error-type'?: string
}

export class UnsupportedCurrencyError extends Error {
  constructor(code: string) {
    super(`Unsupported currency: ${code}`)
    this.name = 'UnsupportedCurrencyError'
  }
}

export async function fetchFromExchangeRateApi(
  apiKey: string,
  baseCurrency: string
): Promise<ExchangeRateResponse> {
  const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${baseCurrency}`

  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
  })

  const data = (await response.json().catch(() => null)) as ExchangeRateApiResponse | null

  if (!data || data.result !== 'success') {
    if (data?.['error-type'] === 'unsupported-code') {
      throw new UnsupportedCurrencyError(baseCurrency)
    }
    throw new Error(
      `ExchangeRate-API returned ${response.status} (${data?.['error-type'] ?? 'no body'})`
    )
  }

  return {
    base: data.base_code,
    rates: data.conversion_rates,
    timestamp: data.time_last_update_unix,
    lastUpdated: new Date().toISOString(),
  }
}
