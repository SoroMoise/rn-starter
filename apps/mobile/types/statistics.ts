import { HistoricalRate } from '.'

export type Period = 7 | 30 | 90 | 270 | 365

export interface Statistics {
  min: number
  max: number
  average: number
  variation: number
  currentRate: number
}

export interface HistoricalData {
  from: string
  to: string
  period: Period
  rates: HistoricalRate[]
  statistics: Statistics
}
