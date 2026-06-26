import { requireOptionalNativeModule } from 'expo-modules-core'

import type { WatchlistPair, WidgetStrings } from './types'

export type DrainedAnalyticsEvent = {
  event: string
  params: Record<string, unknown>
}

export type WidgetSyncState = {
  isPro: boolean
  expiresAtMs: number | null
  gracePeriodMs: number
  decimals: number
  period: number
  pairs: WatchlistPair[]
  strings: WidgetStrings
}

type WidgetWatchlistModuleType = {
  syncState(state: WidgetSyncState): Promise<void>
  requestRefresh(): Promise<void>
  isWidgetAdded(): Promise<boolean>
  drainAnalytics(_unused: boolean): Promise<DrainedAnalyticsEvent[]>
}

const noopModule: WidgetWatchlistModuleType = {
  syncState: async () => {},
  requestRefresh: async () => {},
  isWidgetAdded: async () => false,
  drainAnalytics: async () => [],
}

const nativeModule = requireOptionalNativeModule<WidgetWatchlistModuleType>('WidgetWatchlist')

export default nativeModule ?? noopModule
