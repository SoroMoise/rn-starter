import { APP_STORE_URL, PLAY_STORE_MARKET_URL, PLAY_STORE_WEB_URL } from '@/constants/rating'
import { analyticsService } from '@/services/api/analyticsService'
import { crashlyticsService } from '@/services/api/crashlyticsService'
import * as StoreReview from 'expo-store-review'
import { Linking, Platform } from 'react-native'

// A flow that returns faster than this never rendered anything: Play's per-user
// quota swallowed it. The API deliberately reports neither whether the dialog
// appeared nor whether a review was left, so duration is the only observable
// proxy. It feeds dashboards only — never branch on it.
const REVIEW_FLOW_DISPLAY_FLOOR_MS = 300

function storeCandidates(): (string | undefined)[] {
  if (Platform.OS === 'ios') return [APP_STORE_URL]
  return [PLAY_STORE_MARKET_URL, PLAY_STORE_WEB_URL]
}

/** False where the store's own card cannot exist — on Android, no Play app. */
export async function isNativeReviewAvailable(): Promise<boolean> {
  try {
    return await StoreReview.isAvailableAsync()
  } catch {
    return false
  }
}

/**
 * Native in-app review. Reserved for automatic flows: Play enforces an
 * undocumented per-user quota and silently skips the dialog once it is spent,
 * which is why Google forbids wiring this to a button. Use `openStoreListing`
 * for anything the user taps on purpose.
 *
 * A failure is traced, never answered with the store listing: Google asks that
 * an error in the flow be neither reported to the user nor allowed to change
 * the app's own flow, and nobody asked to leave the app.
 */
export async function requestNativeReview(): Promise<void> {
  try {
    const startedAt = Date.now()
    await StoreReview.requestReview()
    const durationMs = Date.now() - startedAt

    analyticsService.track('review_flow_launched', {
      duration_ms: durationMs,
      likely_displayed: durationMs >= REVIEW_FLOW_DISPLAY_FLOOR_MS,
    })
  } catch (error) {
    crashlyticsService.recordError(error, { source: 'requestNativeReview' })
    analyticsService.track('review_flow_failed', {
      error_code: String((error as { code?: unknown } | null)?.code ?? 'unknown'),
    })
  }
}

/** Opens the store listing. Safe behind a button — no quota, always lands somewhere. */
export async function openStoreListing({ reason }: { reason: string }): Promise<void> {
  for (const url of storeCandidates()) {
    if (!url) continue
    try {
      await Linking.openURL(url)
      analyticsService.track('store_listing_opened', { reason })
      return
    } catch {
      continue
    }
  }

  crashlyticsService.recordError(new Error('No store URL could be opened'), {
    source: `openStoreListing.${reason}`,
  })
}
