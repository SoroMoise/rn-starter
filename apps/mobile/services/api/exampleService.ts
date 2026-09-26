import { backendClient } from '@/services/api/backendClient'
import { withRetry } from '@/utils/retry'
import { BACKEND_CONFIG } from '@constants/config'

export interface ExampleResponse {
  message: string
  at: number
}

// `withRetry` is for a call made outside TanStack Query. A query's `queryFn` calls the client
// directly: the query client already retries, and each of its attempts would retry again.
export const exampleService = {
  fetchExample: ({ signal }: { signal?: AbortSignal } = {}) =>
    withRetry({
      request: async () => (await backendClient.get<ExampleResponse>('/example', { signal })).data,
      maxRetries: BACKEND_CONFIG.MAX_RETRIES,
      retryDelay: BACKEND_CONFIG.RETRY_DELAY,
      signal,
    }),
}
