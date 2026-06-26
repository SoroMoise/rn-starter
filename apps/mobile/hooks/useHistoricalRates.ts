import { fetchHistoricalRates } from '@/services/api/historicalRatesService'
import { useStatisticsStore } from '@/stores/statisticsStore'
import type { ApiError, HistoricalRate, Statistics } from '@/types'
import { isNonRetryableError, toApiError } from '@/utils/apiErrors'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

export interface UseHistoricalRatesResult {
  rates: HistoricalRate[]
  statistics: Statistics | null
  fetchedAt: number | null
  status: 'idle' | 'loading' | 'success' | 'error'
  isFetching: boolean
  isStale: boolean
  error: ApiError | null
  refetch: () => Promise<boolean>
}

export function useHistoricalRates(): UseHistoricalRatesResult {
  const fromCurrency = useStatisticsStore((s) => s.fromCurrency)
  const toCurrency = useStatisticsStore((s) => s.toCurrency)
  const period = useStatisticsStore((s) => s.period)

  const query = useQuery({
    queryKey: ['historicalRates', fromCurrency, toCurrency, period] as const,
    queryFn: ({ signal }) =>
      fetchHistoricalRates({
        params: { fromCurrency, toCurrency, period },
        signal,
      }),
    staleTime: 30 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: (failureCount, error) => {
      if (isNonRetryableError(error)) return false
      return failureCount < 3
    },
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
    placeholderData: keepPreviousData,
  })

  return {
    rates: query.data?.rates ?? [],
    statistics: query.data?.statistics ?? null,
    fetchedAt: query.dataUpdatedAt || null,
    status: query.status === 'pending' ? 'loading' : query.status,
    isFetching: query.isFetching,
    isStale: query.isPlaceholderData,
    error: query.error ? toApiError(query.error) : null,
    refetch: async () => {
      const result = await query.refetch()
      return result.isSuccess
    },
  }
}
