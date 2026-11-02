import { AdService } from '@/services/api/adService'
import { analyticsService } from '@/services/api/analyticsService'
import { crashlyticsService } from '@/services/api/crashlyticsService'
import { promoCoordinator } from '@/services/promo/promoCoordinator'
import { engagementStorage } from '@/services/storage/domains/engagement'
import { reviewStorage } from '@/services/storage/domains/review'
import { useContextualPaywall } from '@hooks/useContextualPaywall'
import { useCallback } from 'react'

type UseActionRatingProps = {
  isAdFreeActive: boolean
}

export function useActionRating({ isAdFreeActive }: UseActionRatingProps) {
  const { maybeTrigger } = useContextualPaywall()

  const recordAction = useCallback(
    async ({
      allowPromos = true,
      allowInterstitial = true,
    }: { allowPromos?: boolean; allowInterstitial?: boolean } = {}) => {
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

      if (allowInterstitial && !isAdFreeActive && promoCoordinator.canPresentAutoPromo()) {
        try {
          await AdService.recordExecution()
          const adShown =
            (await AdService.shouldShowInterstitialAd()) && (await AdService.showInterstitialAd())
          if (adShown) return
        } catch (err) {
          crashlyticsService.recordError(
            err instanceof Error ? err : new Error('Ad chain failed'),
            { source: 'useActionRating.adChain' }
          )
        }
      }

      reviewStorage.setArmed(true)
    },
    [isAdFreeActive, maybeTrigger]
  )

  return { recordAction }
}
