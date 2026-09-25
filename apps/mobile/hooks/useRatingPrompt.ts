import type { RatingMoment } from '@/constants/rating'
import { analyticsService } from '@/services/api/analyticsService'
import { crashlyticsService } from '@/services/api/crashlyticsService'
import { engagementService } from '@/services/api/engagementService'
import { isNativeReviewAvailable, requestNativeReview } from '@/services/api/ratingService'
import { evaluateReviewRequest, type ReviewRequestDecision } from '@/services/api/reviewPolicy'
import { promoCoordinator } from '@/services/promo/promoCoordinator'
import { adsStorage } from '@/services/storage/domains/ads'
import { engagementStorage } from '@/services/storage/domains/engagement'
import { reviewStorage } from '@/services/storage/domains/review'
import { useCallback } from 'react'

export function useRatingPrompt() {
  const maybeAskForRating = useCallback(
    async ({ moment }: { moment: RatingMoment }): Promise<ReviewRequestDecision | null> => {
      try {
        const nativeReviewAvailable = await isNativeReviewAvailable()
        const now = Date.now()
        const session = engagementService.getSessionContext()
        const totalActions = engagementStorage.getActionCount()
        const sessionCount = session?.sessionCount ?? 0
        const daysSinceInstall = session?.daysSinceInstall ?? 0

        const decision = evaluateReviewRequest({
          moment,
          nativeReviewAvailable,
          optedOut: reviewStorage.isOptedOut(),
          requestCount: reviewStorage.getRequestCount(),
          lastRequestAt: reviewStorage.getLastRequestAt(),
          daysSinceInstall,
          sessionCount,
          totalActions,
          lastAdShownAt: adsStorage.getAdLastShown(),
          canPresentAutoPromo: promoCoordinator.canPresentAutoPromo(),
          now,
        })

        const context = {
          moment,
          action_count: totalActions,
          session_count: sessionCount,
          days_since_install: daysSinceInstall,
        }

        if (!decision.show) {
          analyticsService.track('rating_ask_suppressed', { ...context, reason: decision.reason })
          return decision
        }

        // Play's card exposes no visibility to track, and its flow resolves only once the card is
        // gone: the session's interruption and the attempt are spent before it is asked for.
        promoCoordinator.markAutoPromoShown()
        reviewStorage.recordRequest({ index: decision.requestIndex, at: now })
        // Whichever moment asked, an armed ask is now answered: the cooldown would refuse it.
        reviewStorage.setArmed(false)
        analyticsService.track('rating_ask_shown', {
          ...context,
          request_index: decision.requestIndex,
        })
        await requestNativeReview()
        return decision
      } catch (err) {
        crashlyticsService.recordError(err, { source: 'useRatingPrompt.maybeAskForRating' })
        return null
      }
    },
    []
  )

  return { maybeAskForRating }
}
