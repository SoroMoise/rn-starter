import type { ExchangeRate } from '@/types'
import { withRetry } from '@/utils/retry'
import { isValidCurrencyCode } from '@/utils/validators'
import { BACKEND_CONFIG } from '@constants/config'
import axios from 'axios'

if (!BACKEND_CONFIG.URL || !BACKEND_CONFIG.API_KEY) {
  throw new Error(
    'BACKEND_URL and BACKEND_API_KEY must be configured in .env and app.config.js extra'
  )
}

class BackendService {
  private url = BACKEND_CONFIG.URL
  private apiKey = BACKEND_CONFIG.API_KEY
  private timeout = BACKEND_CONFIG.TIMEOUT
  private maxRetries = BACKEND_CONFIG.MAX_RETRIES
  private retryDelay = BACKEND_CONFIG.RETRY_DELAY

  async fetchRates(baseCurrency: string = 'USD'): Promise<ExchangeRate> {
    if (!isValidCurrencyCode(baseCurrency)) {
      throw new Error(`Invalid currency code: ${baseCurrency}`)
    }

    return withRetry(
      async () => {
        const response = await axios.get(`${this.url}/rates/${baseCurrency}`, {
          headers: { 'x-api-key': this.apiKey },
          timeout: this.timeout,
        })

        return {
          base: response.data.base,
          rates: response.data.rates,
          timestamp: response.data.timestamp,
          lastUpdated: new Date(response.data.lastUpdated),
        }
      },
      { maxRetries: this.maxRetries, retryDelay: this.retryDelay }
    )
  }
}

export const backendService = new BackendService()
