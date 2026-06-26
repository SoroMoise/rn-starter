import type { CreateAlertParams, RateAlert } from '@/types'
import { handleAxiosError } from '@/utils/apiErrors'
import { withRetry } from '@/utils/retry'
import { BACKEND_CONFIG } from '@constants/config'
import axios, { isAxiosError } from 'axios'

const BASE_URL = BACKEND_CONFIG.URL
const API_KEY = BACKEND_CONFIG.API_KEY

function headers(rcCustomerId: string) {
  return {
    'x-api-key': API_KEY,
    'x-rc-customer-id': rcCustomerId,
  }
}

export const alertsService = {
  fetchAlerts({ rcCustomerId }: { rcCustomerId: string }): Promise<RateAlert[]> {
    return withRetry(
      async () => {
        const { data } = await axios.get<RateAlert[]>(`${BASE_URL}/alerts`, {
          headers: headers(rcCustomerId),
          timeout: BACKEND_CONFIG.TIMEOUT,
        })
        return data
      },
      { maxRetries: BACKEND_CONFIG.MAX_RETRIES, retryDelay: BACKEND_CONFIG.RETRY_DELAY }
    )
  },

  async createAlert({
    rcCustomerId,
    params,
  }: {
    rcCustomerId: string
    params: CreateAlertParams
  }): Promise<RateAlert> {
    try {
      const { data } = await axios.post<RateAlert>(`${BASE_URL}/alerts`, params, {
        headers: headers(rcCustomerId),
        timeout: BACKEND_CONFIG.TIMEOUT,
      })
      return data
    } catch (err) {
      // Deliberately not retried: a client timeout after a server-side
      // success would create a duplicate alert.
      throw new Error(handleAxiosError(err).message)
    }
  },

  editAlert({
    rcCustomerId,
    alertId,
    params,
  }: {
    rcCustomerId: string
    alertId: string
    params: CreateAlertParams
  }): Promise<RateAlert> {
    // PATCH sets the alert to a fully specified target state, so it is
    // idempotent and safe to retry (unlike createAlert's POST).
    return withRetry(
      async () => {
        const { data } = await axios.patch<RateAlert>(`${BASE_URL}/alerts/${alertId}`, params, {
          headers: headers(rcCustomerId),
          timeout: BACKEND_CONFIG.TIMEOUT,
        })
        return data
      },
      { maxRetries: BACKEND_CONFIG.MAX_RETRIES, retryDelay: BACKEND_CONFIG.RETRY_DELAY }
    )
  },

  deleteAlert({ rcCustomerId, alertId }: { rcCustomerId: string; alertId: string }): Promise<void> {
    return withRetry(
      async () => {
        try {
          await axios.delete(`${BASE_URL}/alerts/${alertId}`, {
            headers: headers(rcCustomerId),
            timeout: BACKEND_CONFIG.TIMEOUT,
          })
        } catch (err) {
          // 404 = already deleted server-side; DELETE is idempotent.
          if (isAxiosError(err) && err.response?.status === 404) return
          throw err
        }
      },
      { maxRetries: BACKEND_CONFIG.MAX_RETRIES, retryDelay: BACKEND_CONFIG.RETRY_DELAY }
    )
  },

  registerToken({ rcCustomerId, token }: { rcCustomerId: string; token: string }): Promise<void> {
    return withRetry(
      async () => {
        await axios.post(
          `${BASE_URL}/alerts/token`,
          { token },
          { headers: headers(rcCustomerId), timeout: BACKEND_CONFIG.TIMEOUT }
        )
      },
      { maxRetries: BACKEND_CONFIG.MAX_RETRIES, retryDelay: BACKEND_CONFIG.RETRY_DELAY }
    )
  },
}
