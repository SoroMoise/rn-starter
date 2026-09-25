import { AdService } from '@/services/api/adService'
import { analyticsService } from '@/services/api/analyticsService'
import { crashlyticsService } from '@/services/api/crashlyticsService'
import { promoCoordinator } from '@/services/promo/promoCoordinator'
import { engagementStorage } from '@/services/storage/domains/engagement'
import { useContextualPaywall } from '@hooks/useContextualPaywall'
import { useRatingPrompt } from '@hooks/useRatingPrompt'
import { useCallback } from 'react'

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
  const { maybeAskForRating } = useRatingPrompt()

  const recordAction = useCallback(
    async ({ allowPromos = true }: { allowPromos?: boolean } = {}) => {
      try {
        const newTotal = engagementStorage.incrementAction()
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
            await AdService.showInterstitialAd()
            return
          }
        } catch (err) {
          crashlyticsService.recordError(
            err instanceof Error ? err : new Error('Ad chain failed'),
            { source: 'useActionRating.adChain' }
          )
        }
      }

      await maybeAskForRating({ moment: 'action_completed' })
    },
    [isAdFreeActive, maybeTrigger, maybeAskForRating]
  )

  return { recordAction }
}
