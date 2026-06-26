import { SUBSCRIPTION_GRACE_PERIOD_MS } from '@/constants/purchases'
import i18n from '@/i18n/service'
import { crashlyticsService } from '@/services/api/crashlyticsService'
import { subscriptionStorage } from '@/services/storage/domains/subscription'
import { useSettingsStore } from '@/stores/settingsStore'
import { useWidgetStore } from '@/stores/widgetStore'
import { WidgetWatchlist, type WatchlistPair, type WidgetStrings } from 'widget-watchlist'

type SyncArgs = {
  isPro: boolean
  expiresAtMs?: number | null
  gracePeriodMs?: number
}

function buildStrings(): WidgetStrings {
  const t = i18n.t.bind(i18n)
  return {
    watchlistTitle: t('widget.watchlist.title'),
    updatedAt: t('widget.watchlist.updatedAt'),
    offline: t('widget.watchlist.offline'),
    emptyState: t('widget.watchlist.emptyState'),
    lockedHeadline: t('widget.locked.headline'),
    lockedTagline: t('widget.locked.tagline'),
    lockedCta: t('widget.locked.cta'),
    refreshing: t('widget.watchlist.refreshing'),
    upToDate: t('widget.watchlist.upToDate'),
  }
}

async function syncToNative(args: SyncArgs): Promise<void> {
  const { settings } = useSettingsStore.getState()
  const { pairs: configuredPairs, period } = useWidgetStore.getState()

  const pairs: WatchlistPair[] = configuredPairs.map((p) => ({
    from: p.from,
    to: p.to,
    rate: 0,
    variationPct: null,
    sparklinePoints: [],
  }))

  try {
    await WidgetWatchlist.syncState({
      isPro: args.isPro,
      expiresAtMs: args.expiresAtMs ?? null,
      gracePeriodMs: args.gracePeriodMs ?? SUBSCRIPTION_GRACE_PERIOD_MS,
      decimals: settings.decimals,
      period,
      pairs,
      strings: buildStrings(),
    })
  } catch (err) {
    void crashlyticsService.recordError(err, { source: 'widget_sync_state' })
  }

  try {
    await widgetService.refresh()
  } catch (err) {
    void crashlyticsService.recordError(err, { source: 'widget_sync_to_native_refresh' })
  }
}

async function syncFromStorage(): Promise<void> {
  const { isPremium, expiresAtMs } = subscriptionStorage.derive(
    Date.now(),
    SUBSCRIPTION_GRACE_PERIOD_MS
  )
  await syncToNative({
    isPro: isPremium,
    expiresAtMs,
    gracePeriodMs: SUBSCRIPTION_GRACE_PERIOD_MS,
  })
}

export const widgetService = {
  syncToNative,
  syncFromStorage,

  // On-demand refresh request. Coalescing lives natively: the worker skips the
  // network while data is still fresh (lastSuccessAt), and WorkManager dedupes
  // concurrent requests (KEEP) — so there is nothing to debounce here.
  async refresh(): Promise<void> {
    await WidgetWatchlist.requestRefresh()
  },
}
