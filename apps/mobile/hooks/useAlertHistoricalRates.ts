import { fetchHistoricalRates } from '@/services/api/historicalRatesService'
import type { HistoricalRate, Statistics } from '@/types'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

const PERIOD_DAYS = 30

interface Params {
  fromCurrency: string
  toCurrency: string
  enabled?: boolean
}

interface Result {
  rates: HistoricalRate[]
  statistics: Statistics | null
  isLoading: boolean
  isError: boolean
}

export function useAlertHistoricalRates({
  fromCurrency,
  toCurrency,
  enabled = true,
}: Params): Result {
  const query = useQuery({
    queryKey: ['historicalRates', fromCurrency, toCurrency, PERIOD_DAYS] as const,
    queryFn: ({ signal }) =>
      fetchHistoricalRates({
        params: { fromCurrency, toCurrency, period: PERIOD_DAYS },
        signal,
      }),
    enabled: enabled && fromCurrency !== toCurrency,
    staleTime: 30 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
    placeholderData: keepPreviousData,
  })

  return {
    rates: query.data?.rates ?? [],
    statistics: query.data?.statistics ?? null,
    isLoading: query.status === 'pending',
    isError: query.isError,
  }
}
