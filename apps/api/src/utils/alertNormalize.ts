import type { RateAlert, ThresholdRateAlert, VariationRateAlert } from '@repo/shared/types/api'

export function normalizeAlertFromKV(raw: unknown): RateAlert | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>

  const baseValid =
    typeof r.id === 'string' &&
    typeof r.rcCustomerId === 'string' &&
    typeof r.fromCurrency === 'string' &&
    typeof r.toCurrency === 'string' &&
    typeof r.createdAt === 'string' &&
    typeof r.isActive === 'boolean'

  if (!baseValid) return null

  if (r.triggerType === 'variation') {
    if (typeof r.variationPercent !== 'number' || typeof r.baselineRate !== 'number') return null
    return r as unknown as VariationRateAlert
  }

  if (typeof r.direction !== 'string' || typeof r.targetRate !== 'number') return null
  if (r.direction !== 'above' && r.direction !== 'below') return null
  return {
    ...(r as object),
    triggerType: 'threshold',
  } as unknown as ThresholdRateAlert
}
