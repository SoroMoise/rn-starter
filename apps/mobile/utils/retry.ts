import i18n from '@/i18n/service'
import type { ApiError } from '@/types'
import { isAxiosError } from 'axios'
import { ApiRequestError, handleAxiosError, isNonRetryableStatus } from './apiErrors'

function isAbortError(error: unknown): boolean {
  if (isAxiosError(error) && error.code === 'ERR_CANCELED') return true
  return error instanceof Error && error.name === 'AbortError'
}

function abortError(): Error {
  const err = new Error('AbortError')
  err.name = 'AbortError'
  return err
}

function abortableDelay({ ms, signal }: { ms: number; signal?: AbortSignal }): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError())
      return
    }
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(abortError())
      },
      { once: true }
    )
  })
}

interface RetryOptions<T> {
  request: () => Promise<T>
  maxRetries: number
  retryDelay: number
  signal?: AbortSignal
}

export async function withRetry<T>({
  request,
  maxRetries,
  retryDelay,
  signal,
}: RetryOptions<T>): Promise<T> {
  let lastError: ApiError | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    if (signal?.aborted) throw abortError()

    try {
      return await request()
    } catch (error) {
      // Abort errors must propagate immediately without retrying
      if (isAbortError(error)) throw error

      lastError = handleAxiosError(error)

      if (isNonRetryableStatus(lastError.statusCode)) break

      if (attempt < maxRetries) {
        await abortableDelay({ ms: Math.min(retryDelay * attempt, 10_000), signal })
      }
    }
  }

  throw new ApiRequestError(
    lastError ?? { message: i18n.t('error.apiError'), code: 'FETCH_FAILED' }
  )
}
