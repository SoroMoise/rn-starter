export interface ExchangeRateApiResponse {
  result: string
  documentation: string
  terms_of_use: string
  time_last_update_unix: number
  time_last_update_utc: string
  time_next_update_unix: number
  time_next_update_utc: string
  base_code: string
  conversion_rates: Record<string, number>
}

export interface HistoricalRateApiResponse {
  result: string
  documentation: string
  terms_of_use: string
  year: number
  month: number
  day: number
  base_code: string
  conversion_rates: Record<string, number>
}

export interface ApiError {
  message: string
  code?: string
  statusCode?: number
}

export type AlertDirection = 'above' | 'below'
export type AlertTriggerType = 'threshold' | 'variation'

interface RateAlertBase {
  id: string
  rcCustomerId: string
  fromCurrency: string
  toCurrency: string
  createdAt: string
  isActive: boolean
  triggeredAt?: string
  triggeredAtRate?: number
}

export interface ThresholdRateAlert extends RateAlertBase {
  triggerType: 'threshold'
  direction: AlertDirection
  targetRate: number
}

export interface VariationRateAlert extends RateAlertBase {
  triggerType: 'variation'
  variationPercent: number
  baselineRate: number
}

export type RateAlert = ThresholdRateAlert | VariationRateAlert

export function isThresholdAlert(a: RateAlert): a is ThresholdRateAlert {
  return a.triggerType === 'threshold'
}

export function isVariationAlert(a: RateAlert): a is VariationRateAlert {
  return a.triggerType === 'variation'
}

export type CreateAlertParams =
  | {
      triggerType?: 'threshold'
      fromCurrency: string
      toCurrency: string
      direction: AlertDirection
      targetRate: number
    }
  | {
      triggerType: 'variation'
      fromCurrency: string
      toCurrency: string
      variationPercent: number
      baselineRate: number
    }
