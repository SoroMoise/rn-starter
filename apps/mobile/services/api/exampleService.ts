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

// `withRetry` is for a call made outside TanStack Query. A query's `queryFn` calls the client
// directly: the query client already retries, and each of its attempts would retry again.
export const exampleService = {
  fetchExample: async ({ signal }: { signal?: AbortSignal } = {}) =>
    fetchWithRetry({ path: '/example', signal }),

  // The Worker asks RevenueCat itself: a free caller gets a 403 (`premium_required`), which
  // `withRetry` does not retry, and `FORCE_PRO` does not reach it.
  fetchPremiumExample: async ({ signal }: { signal?: AbortSignal } = {}) =>
    fetchWithRetry({
      path: '/example/premium',
      headers: { 'x-rc-customer-id': await purchaseService.getAppUserId() },
      signal,
    }),
}
