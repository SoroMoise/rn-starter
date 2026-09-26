import i18n from '@/i18n/service'
import type { ApiError } from '@/types'
import { isAxiosError } from 'axios'

// These errors indicate a client-side problem (bad request, unauthorized, forbidden, not found,
// unprocessable). Retrying will never succeed and wastes quota / risks triggering rate-limit bans.
const NON_RETRYABLE_STATUS_CODES = new Set([400, 401, 403, 404, 422])

// Maps an error `code` the backend returns to the i18n key shown for it; unmapped codes fall back
// to the server's message. Empty until the API defines codes of its own.
const API_ERROR_I18N_KEYS: Record<string, string> = {}

export function handleAxiosError(error: unknown): ApiError {
  if (isAxiosError(error)) {
    if (error.response) {
      const data = error.response.data as
        | { message?: string; code?: string; error?: string }
        | undefined
      const code = data?.code ?? data?.error
      const i18nKey = code ? API_ERROR_I18N_KEYS[code] : undefined
      return {
        message: i18nKey ? i18n.t(i18nKey) : (data?.message ?? i18n.t('error.serverError')),
        code,
        statusCode: error.response.status,
      }
    }

    if (error.request) {
      return {
        message: i18n.t('error.networkError'),
        code: 'NETWORK_ERROR',
      }
    }
  }

  return {
    message: error instanceof Error ? error.message : i18n.t('error.unknownError'),
    code: 'UNKNOWN_ERROR',
  }
}

export function isNonRetryableStatus(status: number | undefined): boolean {
  return status !== undefined && NON_RETRYABLE_STATUS_CODES.has(status)
}

export function isNonRetryableError(error: unknown): boolean {
  return isAxiosError(error) && isNonRetryableStatus(error.response?.status)
}

export function toApiError(error: unknown): ApiError {
  return handleAxiosError(error)
}
