import { crashlyticsService } from '@/services/api/crashlyticsService'

const CONDITION_CODES: ReadonlySet<string> = new Set([
  'no-fill',
  'mediation-no-fill',
  'network-error',
  'timeout',
  'server-error',
  'internal-error',
  'os-version-too-low',
  'null-activity',
  'nil-vc',
])

// The library hands listeners `googleMobileAds/<code>`, and an Android banner prefixes the code
// with `error-code-` as well: matched as they come, no code would ever be a condition, and every
// no-fill would land in Crashlytics as a non-fatal.
const readCode = (error: unknown): string => {
  const code = (error as { code?: unknown } | null | undefined)?.code
  if (typeof code !== 'string') return 'none'
  return code.replace(/^googleMobileAds\//, '').replace(/^error-code-/, '')
}

export function reportAdFailure({ error, source }: { error: unknown; source: string }): void {
  const code = readCode(error)

  if (CONDITION_CODES.has(code)) {
    const message = `${source} failed: ${code}`
    crashlyticsService.log(message)
    if (__DEV__) console.warn(`[ads] ${message}`)
    return
  }

  void crashlyticsService.recordError(error, { source, code })
}
