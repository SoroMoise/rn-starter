import { MIN_STARS_FOR_STORE_REDIRECT } from '@/constants/rating'
import { AdService } from '@/services/api/adService'
import { analyticsService } from '@/services/api/analyticsService'
import { crashlyticsService } from '@/services/api/crashlyticsService'
import { requestStoreReview } from '@/services/api/ratingService'
import { adsStorage } from '@/services/storage/domains/ads'
import { engagementStorage } from '@/services/storage/domains/engagement'
import { useAppRating } from '@hooks/useAppRating'
import { useContextualPaywall } from '@hooks/useContextualPaywall'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert } from 'react-native'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()
  const { maybeTrigger } = useContextualPaywall()
  const { checkAndMaybeShowRating, markAsDeclinedForever, markAsLater, markAsRated } = useAppRating()

  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false)
  const [currentRatingActionCount, setCurrentRatingActionCount] = useState(0)

  // Cache adLastShown to avoid hitting MMKV on every action; seeded on mount,
  // refreshed in-memory whenever an interstitial is displayed.
  const adLastShownCacheRef = useRef<number>(0)
  const isRatingModalVisibleRef = useRef(isRatingModalVisible)

  useEffect(() => {
    adLastShownCacheRef.current = adsStorage.getAdLastShown()
  }, [])

  useEffect(() => {
    isRatingModalVisibleRef.current = isRatingModalVisible
  }, [isRatingModalVisible])

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

    if (isRatingModalVisibleRef.current) return
    try {
      const shouldShowRating = await checkAndMaybeShowRating({
        wasSuccessful: true,
        totalActions: newTotal,
        lastInterstitialShownAt: adLastShownCacheRef.current,
      })
      if (shouldShowRating) {
        setCurrentRatingActionCount(newTotal)
        setIsRatingModalVisible(true)
        analyticsService.track('rating_modal_shown', { source: 'auto', action_count: newTotal })
      }
    } catch (err) {
      crashlyticsService.recordError(
        err instanceof Error ? err : new Error('Rating check failed'),
        { source: 'useActionRating.ratingFlow' }
      )
    }
  }, [isAdFreeActive, maybeTrigger, checkAndMaybeShowRating])

  const handleRateApp = useCallback(
    async (stars: number) => {
      setIsRatingModalVisible(false)
      analyticsService.track('rating_submitted', {
        stars,
        source: 'auto',
        action_count: currentRatingActionCount,
      })
      try {
        await markAsRated()
        if (stars >= MIN_STARS_FOR_STORE_REDIRECT) {
          await requestStoreReview()
        } else {
          Alert.alert(t('common.appName'), t('appRating.thankYou'), [{ text: t('common.ok') }], {
            cancelable: true,
          })
        }
      } catch (err) {
        crashlyticsService.recordError(
          err instanceof Error ? err : new Error('handleRateApp failed'),
          { source: 'useActionRating.handleRateApp' }
        )
      }
    },
    [markAsRated, t, currentRatingActionCount]
  )

  const handleRateLater = useCallback(async () => {
    setIsRatingModalVisible(false)
    analyticsService.track('rating_later', { source: 'auto' })
    try {
      await markAsLater(currentRatingActionCount)
    } catch (err) {
      crashlyticsService.recordError(
        err instanceof Error ? err : new Error('handleRateLater failed'),
        { source: 'useActionRating.handleRateLater' }
      )
    }
  }, [currentRatingActionCount, markAsLater])

  const handleDeclineRating = useCallback(async () => {
    setIsRatingModalVisible(false)
    analyticsService.track('rating_declined', { source: 'auto' })
    try {
      await markAsDeclinedForever()
    } catch (err) {
      crashlyticsService.recordError(
        err instanceof Error ? err : new Error('handleDeclineRating failed'),
        { source: 'useActionRating.handleDeclineRating' }
      )
    }
  }, [markAsDeclinedForever])

  return {
    recordAction,
    isRatingModalVisible,
    handleRateApp,
    handleRateLater,
    handleDeclineRating,
  }
}
