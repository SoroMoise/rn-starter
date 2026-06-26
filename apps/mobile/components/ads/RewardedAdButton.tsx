import { GradientButton } from '@/components/ui/GradientButton'
import { ThemedText } from '@/components/ui/ThemedText'
import { AD_REWARDED_FREE_DURATION_MINUTES } from '@/constants/admob'
import { useAdFreeRemainingMinutes } from '@/hooks/useAdFreeRemainingMinutes'
import { useContextualPaywall } from '@/hooks/useContextualPaywall'
import { useAdFree } from '@/providers/AdFreeProvider'
import { analyticsService } from '@/services/api/analyticsService'
import { RewardedAdService } from '@/services/api/rewardedAdService'
import { Language } from '@/types'
import { formatMinutesAsDuration } from '@/utils/time'
import Ionicons from '@expo/vector-icons/Ionicons'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, StyleSheet, View } from 'react-native'

export function RewardedAdButton() {
  const { isAdFreeActive, activateAdFreeReward } = useAdFree()
  const adFreeRemainingMinutes = useAdFreeRemainingMinutes()
  const { maybeTrigger } = useContextualPaywall()
  const { t, i18n } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const language = i18n.language as Language

  const durationLabel = formatMinutesAsDuration(AD_REWARDED_FREE_DURATION_MINUTES, language)
  const remainingLabel = formatMinutesAsDuration(adFreeRemainingMinutes, language)

  useEffect(() => {
    if (isAdFreeActive) return
    void RewardedAdService.preloadRewardedAd()
  }, [isAdFreeActive])

  const handleWatchAd = async () => {
    if (!RewardedAdService.isRewardedAdReady()) {
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
      const success = await RewardedAdService.showRewardedAd(async () => {
        await activateAdFreeReward()
      })

      if (success) {
        analyticsService.track('rewarded_ad_result', {
          result: 'completed',
          ad_free_duration_minutes: AD_REWARDED_FREE_DURATION_MINUTES,
        })
        Alert.alert(
          t('settings.adRewardTitle'),
          t('settings.adRewardMessage', { duration: durationLabel }),
          undefined,
          { cancelable: true }
        )
      } else {
        analyticsService.track('rewarded_ad_result', {
          result: 'dismissed',
          ad_free_duration_minutes: AD_REWARDED_FREE_DURATION_MINUTES,
        })
      }
      setTimeout(() => maybeTrigger('rewarded_ad_dismissed'), 800)
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
      <View style={styles.button}>
        <LinearGradient
          colors={['#10b981', '#059669']}
          style={styles.buttonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}>
          <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
          <ThemedText color="inherit" style={styles.buttonText}>
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
      colors={['#2f95dc', '#25A4FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.button}
      gradientStyle={styles.buttonGradient}
      accessibilityLabel={t('settings.watchAdButton', { duration: durationLabel })}>
      <Ionicons name="play-circle" size={24} color="#ffffff" />
      <ThemedText color="inherit" style={styles.buttonText}>
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
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
})
