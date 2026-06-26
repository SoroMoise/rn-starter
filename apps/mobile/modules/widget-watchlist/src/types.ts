// `variationPct` is the percentage variation over the user-configured
// period (7d / 1m / 3m / 9m / 1y).
export type WatchlistPair = {
  from: string
  to: string
  rate: number
  variationPct: number | null
  sparklinePoints: number[]
}

export type WidgetStrings = {
  watchlistTitle: string
  updatedAt: string
  offline: string
  emptyState: string
  lockedHeadline: string
  lockedTagline: string
  lockedCta: string
  refreshing: string
  upToDate: string
}
