import { Language } from './settings'

export interface Currency {
  code: string
  name: string
  localizedNames: Partial<Record<Language, string>>
  symbol: string
  flag: string
  isFavorite: boolean
}

export interface ExchangeRate {
  base: string
  rates: Record<string, number>
  timestamp: number
  lastUpdated: Date
}

export interface ConversionResult {
  amount: number
  from: Currency
  to: Currency
  result: number
  rate: number
  timestamp: Date
}

export interface HistoricalRate {
  date: string
  rate: number
}

export interface CurrencyPair {
  from: string
  to: string
  isFavorite: boolean
}

export interface LastConversionState {
  amount: string
  fromCurrencyCode: string
}
