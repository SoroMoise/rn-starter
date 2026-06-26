export interface ExchangeRateResponse {
  base: string
  rates: Record<string, number>
  timestamp: number
  lastUpdated: string
}

export interface CurrencyInfo {
  code: string
  name: string
  symbol: string
  flag: string
}

export interface HistoricalRatePoint {
  date: string
  rate: number
}

export interface HistoricalStatistics {
  min: number
  max: number
  average: number
  variation: number
  currentRate: number
}

export interface HistoricalRatesResponse {
  base: string
  target: string
  period: number
  rates: HistoricalRatePoint[]
  statistics: HistoricalStatistics
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

export type CreateAlertRequest =
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

export type AlertsResponse = RateAlert[]
