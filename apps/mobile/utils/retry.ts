import i18n from '@/i18n/service'
import type { ApiError } from '@/types'
import { isAxiosError } from 'axios'
import { handleAxiosError } from './apiErrors'

// These errors indicate a client-side problem (bad request, unauthorized, forbidden, not found,
// unprocessable). Retrying will never succeed and wastes quota / risks triggering rate-limit bans.
const NON_RETRYABLE_STATUS_CODES = new Set([400, 401, 403, 404, 422])

function isAbortError(error: unknown): boolean {
  if (isAxiosError(error) && error.code === 'ERR_CANCELED') return true
  return error instanceof Error && error.name === 'AbortError'
}

function abortableDelay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('AbortError'))
      return
    }
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        const err = new Error('AbortError')
        err.name = 'AbortError'
        reject(err)
      },
      { once: true }
    )
  })
}

interface RetryOptions {
  maxRetries: number
  retryDelay: number
  signal?: AbortSignal
}

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  let lastError: ApiError | null = null

  for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
    if (options.signal?.aborted) {
      const err = new Error('AbortError')
      err.name = 'AbortError'
      throw err
    }

    try {
      return await fn()
    } catch (error) {
      // Abort errors must propagate immediately without retrying
      if (isAbortError(error)) throw error

      lastError = handleAxiosError(error)

      if (lastError.statusCode && NON_RETRYABLE_STATUS_CODES.has(lastError.statusCode)) {
        break
      }

      if (attempt < options.maxRetries) {
        const delay = Math.min(options.retryDelay * attempt, 10_000)
        await abortableDelay(delay, options.signal)
      }
    }
  }

  const finalError = lastError ?? { message: i18n.t('error.apiError'), code: 'FETCH_FAILED' }
  throw new Error(finalError.message)
}
