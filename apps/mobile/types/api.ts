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

