import { GradientButton } from '@/components/ui/GradientButton'
import { ThemedText } from '@/components/ui/ThemedText'
import { AD_REWARDED_FREE_DURATION_MINUTES } from '@/constants/admob'
import { GRADIENTS } from '@/constants/uiColors'
import { useAdFreeRemainingMinutes } from '@/hooks/useAdFreeRemainingMinutes'
import { useAdsConsent } from '@/hooks/useAdsConsent'
import { useContextualPaywall } from '@/hooks/useContextualPaywall'
import { useAdFree } from '@/providers/AdFreeProvider'
import { analyticsService } from '@/services/api/analyticsService'
import { RewardedAdService } from '@/services/api/rewardedAdService'
import { Language } from '@/types'
import { formatMinutesAsDuration } from '@/utils/time'
import Ionicons from '@expo/vector-icons/Ionicons'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, StyleSheet, View } from 'react-native'

export function RewardedAdButton() {
  const { isAdFreeActive, activateAdFreeReward } = useAdFree()
  const adFreeRemainingMinutes = useAdFreeRemainingMinutes()
  const { canRequestAds } = useAdsConsent()
  const { maybeTrigger } = useContextualPaywall()
  const { t, i18n } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const promoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const language = i18n.language as Language

  useEffect(
    () => () => {
      if (promoTimeoutRef.current !== null) clearTimeout(promoTimeoutRef.current)
    },
    []
  )

  const durationLabel = formatMinutesAsDuration(AD_REWARDED_FREE_DURATION_MINUTES, language)
  const remainingLabel = formatMinutesAsDuration(adFreeRemainingMinutes, language)

  useEffect(() => {
    if (isAdFreeActive || !canRequestAds) return
    RewardedAdService.preload({ placement: 'settings' })
  }, [isAdFreeActive, canRequestAds])

  const handleWatchAd = async () => {
    if (!RewardedAdService.isReady({ placement: 'settings' })) {
      Alert.alert(
        t('settings.adNotAvailableTitle'),
        t('settings.adNotAvailableMessage'),
        undefined,
        { cancelable: true }
      )
      return
    }

    setIsLoading(true)

    try {
      const outcome = await RewardedAdService.show({
        placement: 'settings',
        onRewarded: () => void activateAdFreeReward(),
      })

      analyticsService.track('rewarded_ad_result', {
        result: outcome === 'earned' ? 'completed' : outcome,
        ad_free_duration_minutes: AD_REWARDED_FREE_DURATION_MINUTES,
      })

      if (outcome === 'earned') {
        Alert.alert(
          t('settings.adRewardTitle'),
          t('settings.adRewardMessage', { duration: durationLabel }),
          undefined,
          { cancelable: true }
        )
        return
      }

      if (outcome === 'failed') {
        Alert.alert(t('settings.adErrorTitle'), t('settings.adErrorMessage'), undefined, {
          cancelable: true,
        })
        return
      }

      // Only a declined video is the moment to sell its removal, never one just watched in full.
      promoTimeoutRef.current = setTimeout(() => maybeTrigger('rewarded_ad_dismissed'), 800)
    } catch {
      Alert.alert(t('settings.adErrorTitle'), t('settings.adErrorMessage'), undefined, {
        cancelable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isAdFreeActive) {
    return (
      <View className="my-2.5 w-full overflow-hidden rounded-xl">
        <LinearGradient
          colors={GRADIENTS.success}
          style={styles.buttonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}>
          <Ionicons
            name="checkmark-circle"
            size={24}
            color="#ffffff"
            importantForAccessibility="no"
          />
          <ThemedText
            color="inherit"
            align="center"
            weight="semibold"
            className="shrink text-[13px] leading-[19px] text-white">
            {t('settings.adFreeActive', { duration: remainingLabel })}
          </ThemedText>
        </LinearGradient>
      </View>
    )
  }

  return (
    <GradientButton
      onPress={handleWatchAd}
      isLoading={isLoading}
      colors={GRADIENTS.rewarded}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.button}
      gradientStyle={styles.buttonGradient}
      accessibilityLabel={t('settings.watchAdButton', { duration: durationLabel })}>
      <Ionicons name="play-circle" size={24} color="#ffffff" />
      <ThemedText
        color="inherit"
        align="center"
        weight="semibold"
        className="shrink text-[13px] leading-[19px] text-white">
        {t('settings.watchAdButton', { duration: durationLabel })}
      </ThemedText>
    </GradientButton>
  )
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 10,
  },
  buttonGradient: {
    paddingVertical: 13,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
})
