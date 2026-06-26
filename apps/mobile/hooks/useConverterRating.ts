import { MIN_STARS_FOR_STORE_REDIRECT } from '@/constants/rating'
import { AdService } from '@/services/api/adService'
import { analyticsService } from '@/services/api/analyticsService'
import { crashlyticsService } from '@/services/api/crashlyticsService'
import { requestStoreReview } from '@/services/api/ratingService'
import { conversionStorage } from '@/services/storage/domains/conversion'
import { triggerBackupSync } from '@stores/backupTrigger'
import { useAppRating } from '@hooks/useAppRating'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert } from 'react-native'
import { useTranslation } from 'react-i18next'

type UseConverterRatingProps = {
  conversions: unknown[]
  fromCurrencyCode: string
  amount: string
  isAdFreeActive: boolean
  conversionActionCount: number
}

function getAmountRange(amount: number): 'micro' | 'small' | 'medium' | 'large' | 'xlarge' {
  if (amount < 10) return 'micro'
  if (amount < 100) return 'small'
  if (amount < 1000) return 'medium'
  if (amount < 10000) return 'large'
  return 'xlarge'
}

export function useConverterRating({
  conversions,
  fromCurrencyCode,
  amount,
  isAdFreeActive,
  conversionActionCount,
}: UseConverterRatingProps) {
  const { t } = useTranslation()
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false)
  const [currentRatingConversionCount, setCurrentRatingConversionCount] = useState(0)

  // Cache adLastShown to avoid hitting MMKV on every conversion.
  // Seeded from storage on mount; updated in-memory when an interstitial ad is displayed.
  const adLastShownCacheRef = useRef<number>(0)

  // Mirror values that should not retrigger the conversion effect when they change.
  // The effect reads them through refs, so changes propagate without re-running it.
  const isAdFreeActiveRef = useRef(isAdFreeActive)
  const isRatingModalVisibleRef = useRef(isRatingModalVisible)
  const conversionsRef = useRef(conversions)
  const fromCurrencyCodeRef = useRef(fromCurrencyCode)
  const amountRef = useRef(amount)

  useEffect(() => {
    adLastShownCacheRef.current = conversionStorage.getAdLastShown()
  }, [])

  useEffect(() => {
    isAdFreeActiveRef.current = isAdFreeActive
  }, [isAdFreeActive])

  useEffect(() => {
    isRatingModalVisibleRef.current = isRatingModalVisible
  }, [isRatingModalVisible])

  useEffect(() => {
    conversionsRef.current = conversions
  }, [conversions])

  useEffect(() => {
    fromCurrencyCodeRef.current = fromCurrencyCode
  }, [fromCurrencyCode])

  useEffect(() => {
    amountRef.current = amount
  }, [amount])

  const { checkAndMaybeShowRating, markAsDeclinedForever, markAsLater, markAsRated } =
    useAppRating()

  useEffect(() => {
    if (conversionActionCount === 0) return
    if (conversionsRef.current.length === 0) return
    if (!(parseFloat(amountRef.current) > 0)) return

    // Ad and rating paths run sequentially: the ad must resolve first so that
    // adLastShownCacheRef.current is up-to-date when the rating gate reads it.
    void (async () => {
      if (!isAdFreeActiveRef.current) {
        try {
          await AdService.recordExecution()
          const shouldShow = await AdService.shouldShowInterstitialAd()
          if (shouldShow) {
            await AdService.showInterstitialAd()
            adLastShownCacheRef.current = Date.now()
          }
        } catch (err) {
          crashlyticsService.recordError(
            err instanceof Error ? err : new Error('Ad chain failed'),
            { source: 'useConverterRating.adChain' }
          )
        }
      }

      if (isRatingModalVisibleRef.current) return
      try {
        const newTotal = conversionStorage.incrementSuccessful()
        triggerBackupSync()
        analyticsService.track('conversion_performed', {
          from_currency: fromCurrencyCodeRef.current,
          amount_range: getAmountRange(parseFloat(amountRef.current)),
          target_count: conversionsRef.current.length,
          total_conversions: newTotal,
        })
        const shouldShowRating = await checkAndMaybeShowRating({
          wasSuccessful: true,
          totalSuccessfulConversions: newTotal,
          hasFavorites: true,
          lastInterstitialShownAt: adLastShownCacheRef.current,
        })
        if (shouldShowRating) {
          setCurrentRatingConversionCount(newTotal)
          setIsRatingModalVisible(true)
          analyticsService.track('rating_modal_shown', {
            source: 'auto',
            conversion_count: newTotal,
          })
        }
      } catch (err) {
        crashlyticsService.recordError(
          err instanceof Error ? err : new Error('Rating check failed'),
          { source: 'useConverterRating.ratingFlow' }
        )
      }
    })()
    // checkAndMaybeShowRating is stable (memoized with []). conversionActionCount is
    // the sole trigger — other values are read via refs to avoid spurious re-runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversionActionCount])

  const handleRateApp = useCallback(
    async (stars: number) => {
      setIsRatingModalVisible(false)
      analyticsService.track('rating_submitted', {
        stars,
        source: 'auto',
        conversion_count: currentRatingConversionCount,
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
          { source: 'useConverterRating.handleRateApp' }
        )
      }
    },
    [markAsRated, t, currentRatingConversionCount]
  )

  const handleRateLater = useCallback(async () => {
    setIsRatingModalVisible(false)
    analyticsService.track('rating_later', { source: 'auto' })
    try {
      await markAsLater(currentRatingConversionCount)
    } catch (err) {
      crashlyticsService.recordError(
        err instanceof Error ? err : new Error('handleRateLater failed'),
        { source: 'useConverterRating.handleRateLater' }
      )
    }
  }, [currentRatingConversionCount, markAsLater])

  const handleDeclineRating = useCallback(async () => {
    setIsRatingModalVisible(false)
    analyticsService.track('rating_declined', { source: 'auto' })
    try {
      await markAsDeclinedForever()
    } catch (err) {
      crashlyticsService.recordError(
        err instanceof Error ? err : new Error('handleDeclineRating failed'),
        { source: 'useConverterRating.handleDeclineRating' }
      )
    }
  }, [markAsDeclinedForever])

  return {
    isRatingModalVisible,
    handleRateApp,
    handleRateLater,
    handleDeclineRating,
  }
}
