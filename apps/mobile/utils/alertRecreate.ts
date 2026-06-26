import type { CreateAlertParams, RateAlert } from '@/types'
import { isThresholdAlert } from '@/types'

export function buildRecreateParams(alert: RateAlert): CreateAlertParams {
  if (isThresholdAlert(alert)) {
    return {
      fromCurrency: alert.fromCurrency,
      toCurrency: alert.toCurrency,
      direction: alert.direction,
      targetRate: alert.targetRate,
    }
  }
  return {
    triggerType: 'variation',
    fromCurrency: alert.fromCurrency,
    toCurrency: alert.toCurrency,
    variationPercent: alert.variationPercent,
    baselineRate: alert.baselineRate,
  }
}
