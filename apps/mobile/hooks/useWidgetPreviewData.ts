import { fetchHistoricalRates } from '@/services/api/historicalRatesService'
import { useCurrencyStore } from '@/stores/currencyStore'
import type { PairKey, WidgetPeriodDays } from '@/stores/widgetStore'
import { isValidCurrencyCode } from '@/utils/validators'
import { useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'

export interface WidgetPreviewPair {
  from: string
  to: string
  rate: number | null
  variationPct: number | null
  sparklinePoints: number[]
}

function crossRate({
  rates,
  from,
  to,
}: {
  rates: Record<string, number> | undefined
  from: string
  to: string
}): number | null {
  if (!rates) return null
  if (from === to) return 1
  const fromRate = rates[from]
  const toRate = rates[to]
  if (!fromRate || !toRate) return null
  return toRate / fromRate
}

export function useWidgetPreviewData({
  pairs,
  period,
  enabled,
}: {
  pairs: PairKey[]
  period: WidgetPeriodDays
  enabled: boolean
}): WidgetPreviewPair[] {
  const rates = useCurrencyStore((s) => s.rates)

  const queries = useQueries({
    queries: pairs.map((pair) => ({
      queryKey: ['historicalRates', pair.from, pair.to, period] as const,
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        fetchHistoricalRates({
          params: { fromCurrency: pair.from, toCurrency: pair.to, period },
          signal,
        }),
      enabled:
        enabled &&
        pair.from !== pair.to &&
        isValidCurrencyCode(pair.from) &&
        isValidCurrencyCode(pair.to),
      staleTime: 30 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
    })),
  })

  return useMemo(
    () =>
      pairs.map((pair, i) => {
        const stats = queries[i]?.data?.statistics
        const history = queries[i]?.data?.rates
        return {
          from: pair.from,
          to: pair.to,
          rate:
            crossRate({ rates: rates?.rates, from: pair.from, to: pair.to }) ??
            stats?.currentRate ??
            null,
          variationPct: stats?.variation ?? null,
          sparklinePoints: history?.map((point) => point.rate) ?? [],
        }
      }),
    [pairs, queries, rates]
  )
}
