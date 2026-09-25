import { AdService } from '@/services/api/adService'
import { analyticsService } from '@/services/api/analyticsService'
import { crashlyticsService } from '@/services/api/crashlyticsService'
import { requestNativeReview } from '@/services/api/ratingService'
import { promoCoordinator } from '@/services/promo/promoCoordinator'
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
 *   1. increments the persistent action counter (`engagementStorage`), whatever follows,
 *   2. offers the moment to the contextual paywall (`after_n_actions` trigger),
 *   3. then to an interstitial ad when due (unless an ad-free window is open),
 *   4. then to the app-store rating prompt.
 * The first surface to take the moment ends the chain, and all three draw on the session's
 * single automatic interruption (`promoCoordinator`).
 *
 * `recordAction({ allowPromos: false })` moves the counter and nothing else — for the user's
 * first success, which decides whether they come back tomorrow, and for an action abandoned
 * or failed, which has nothing to celebrate.
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

  const recordAction = useCallback(
    async ({ allowPromos = true }: { allowPromos?: boolean } = {}) => {
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

      if (!allowPromos) return

      if (maybeTrigger('after_n_actions')) return

      // The ad's counter only moves on actions that could have gone to an ad: counted through a
      // session whose interruption is spent, it would open the next session on an ad at once.
      if (!isAdFreeActive && promoCoordinator.canPresentAutoPromo()) {
        try {
          await AdService.recordExecution()
          if (await AdService.shouldShowInterstitialAd()) {
            // The moment belongs to the ad even when it failed to open: a rating card
            // arriving seconds later would land out of context.
            if (await AdService.showInterstitialAd()) adLastShownCacheRef.current = Date.now()
            return
          }
        } catch (err) {
          crashlyticsService.recordError(
            err instanceof Error ? err : new Error('Ad chain failed'),
            { source: 'useActionRating.adChain' }
          )
        }
      }

      if (!promoCoordinator.canPresentAutoPromo()) return

      try {
        const shouldShowRating = await checkAndMaybeShowRating({
          wasSuccessful: true,
          totalActions: newTotal,
          lastInterstitialShownAt: adLastShownCacheRef.current,
        })
        if (shouldShowRating) {
          promoCoordinator.markAutoPromoShown()
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
    },
    [isAdFreeActive, maybeTrigger, checkAndMaybeShowRating, markReviewFlowLaunched]
  )

  return { recordAction }
}
