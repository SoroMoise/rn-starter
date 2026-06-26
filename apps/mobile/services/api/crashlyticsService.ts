import {
  log as crashlyticsLog,
  recordError as crashlyticsRecordError,
  setAttributes as crashlyticsSetAttributes,
  getCrashlytics,
} from '@react-native-firebase/crashlytics'

const ensureError = (error: unknown): Error => {
  if (error instanceof Error) return error
  return new Error(String(error ?? 'Unknown error'))
}

export const crashlyticsService = {
  log(message: string): void {
    try {
      const crashlytics = getCrashlytics()
      crashlyticsLog(crashlytics, message)
    } catch {
      if (__DEV__) console.warn('[Crashlytics] log failed:', message)
    }
  },

  async recordError(error: unknown, context?: Record<string, string>): Promise<void> {
    try {
      const normalizedError = ensureError(error)

      if (__DEV__) {
        console.warn(`[Crashlytics] ${context?.source ?? 'unknown'}:`, normalizedError.message)
      }

      const crashlytics = getCrashlytics()
      if (context) {
        await crashlyticsSetAttributes(crashlytics, context)
      }

      crashlyticsRecordError(crashlytics, normalizedError)
    } catch {
      if (__DEV__) console.warn('[Crashlytics] recordError failed')
    }
  },

  async setUserAttributes(attrs: {
    language?: string
    theme?: string
    currenciesCount?: number
  }): Promise<void> {
    try {
      const normalized: Record<string, string> = {}
      if (attrs.language !== undefined) normalized.language = attrs.language
      if (attrs.theme !== undefined) normalized.theme = attrs.theme
      if (attrs.currenciesCount !== undefined)
        normalized.currencies_count = String(attrs.currenciesCount)

      if (Object.keys(normalized).length === 0) return

      const crashlytics = getCrashlytics()
      await crashlyticsSetAttributes(crashlytics, normalized)
    } catch {
      if (__DEV__) console.warn('[Crashlytics] setUserAttributes failed')
    }
  },
}
