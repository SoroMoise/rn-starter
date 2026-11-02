import { getBackendClient } from '@/services/api/backendClient'
import { purchaseService } from '@/services/api/purchaseService'
import { withRetry } from '@/utils/retry'
import { BACKEND_CONFIG } from '@constants/config'

export interface ExampleResponse {
  message: string
  at: number
}

function fetchWithRetry({
  path,
  headers,
  signal,
}: {
  path: string
  headers?: Record<string, string>
  signal?: AbortSignal
}) {
  const client = getBackendClient()
  return withRetry({
    request: async () => (await client.get<ExampleResponse>(path, { headers, signal })).data,
    maxRetries: BACKEND_CONFIG.MAX_RETRIES,
    retryDelay: BACKEND_CONFIG.RETRY_DELAY,
    signal,
  })
}

export const exampleService = {
  fetchExample: async ({ signal }: { signal?: AbortSignal } = {}) =>
    fetchWithRetry({ path: '/example', signal }),

  fetchPremiumExample: async ({ signal }: { signal?: AbortSignal } = {}) =>
    fetchWithRetry({
      path: '/example/premium',
      headers: { 'x-rc-customer-id': await purchaseService.getAppUserId() },
      signal,
    }),
}
