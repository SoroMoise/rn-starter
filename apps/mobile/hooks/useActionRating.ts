import { AdService } from '@/services/api/adService'
import { analyticsService } from '@/services/api/analyticsService'
import { crashlyticsService } from '@/services/api/crashlyticsService'
import { requestNativeReview } from '@/services/api/ratingService'
import { adsStorage } from '@/services/storage/domains/ads'
import { engagementStorage } from '@/services/storage/domains/engagement'
import { useAppRating } from '@hooks/useAppRating'
import { useContextualPaywall } from '@hooks/useContextualPaywall'
import { useCallback, useEffect, useRef } from 'react'

type UseActionRatingProps = {
  isAdFreeActive: boolean
}

/**
 * Premium engagement loop driven by a GENERIC action counter.
 *
 * Call `recordAction()` from any meaningful user interaction. Each call:
 *   1. increments the persistent action counter (`engagementStorage`),
 *   2. shows an interstitial ad when due (unless an ad-free session is active),
 *   3. evaluates the contextual paywall (`after_n_actions` trigger),
 *   4. evaluates the app-store rating prompt.
 *
 * This is the integration point a new app wires into its own value moments.
 */
export function useActionRating({ isAdFreeActive }: UseActionRatingProps) {
  const { maybeTrigger } = useContextualPaywall()
  const { checkAndMaybeShowRating, markReviewFlowLaunched } = useAppRating()

  // Cache adLastShown to avoid hitting MMKV on every action; seeded on mount,
  // refreshed in-memory whenever an interstitial is displayed.
  const adLastShownCacheRef = useRef<number>(0)

  useEffect(() => {
    adLastShownCacheRef.current = adsStorage.getAdLastShown()
  }, [])

  const recordAction = useCallback(async () => {
    // Ad and rating paths run sequentially so adLastShownCacheRef is up-to-date
    // when the rating gate reads it.
    if (!isAdFreeActive) {
      try {
        await AdService.recordExecution()
        if (await AdService.shouldShowInterstitialAd()) {
          await AdService.showInterstitialAd()
          adLastShownCacheRef.current = Date.now()
        }
      } catch (err) {
        crashlyticsService.recordError(err instanceof Error ? err : new Error('Ad chain failed'), {
          source: 'useActionRating.adChain',
        })
      }
    }

    let newTotal = 0
    try {
      newTotal = engagementStorage.incrementAction()
      analyticsService.track('action_performed', { total_actions: newTotal })
    } catch (err) {
      crashlyticsService.recordError(
        err instanceof Error ? err : new Error('Action increment failed'),
        { source: 'useActionRating.increment' }
      )
      return
    }

    // The contextual paywall claims the one auto-promo slot first; only fall
    // through to the rating prompt when it does not fire.
    if (maybeTrigger('after_n_actions')) return

    try {
      const shouldShowRating = await checkAndMaybeShowRating({
        wasSuccessful: true,
        totalActions: newTotal,
        lastInterstitialShownAt: adLastShownCacheRef.current,
      })
      if (shouldShowRating) {
        // Play's card is the whole ask: no question, no star picker, nothing
        // rendered before it. Record the attempt first — the API never reports
        // whether the card appeared, so a swallowed call must not look spent.
        analyticsService.track('rating_ask_shown', { source: 'auto', action_count: newTotal })
        await markReviewFlowLaunched(newTotal)
        await requestNativeReview()
      }
    } catch (err) {
      crashlyticsService.recordError(
        err instanceof Error ? err : new Error('Rating check failed'),
        { source: 'useActionRating.ratingFlow' }
      )
    }
  }, [isAdFreeActive, maybeTrigger, checkAndMaybeShowRating, markReviewFlowLaunched])

  return { recordAction }
}
