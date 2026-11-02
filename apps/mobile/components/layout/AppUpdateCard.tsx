import { GradientButton } from '@/components/ui/GradientButton'
import { ThemedText } from '@/components/ui/ThemedText'
import {
  AD_BANNER_INDEX_ENABLED,
  AD_BANNER_SETTINGS_ENABLED,
  ADMOB_INDEX_BANNER_ID,
  ADMOB_SETTINGS_BANNER_ID,
} from '@/constants/admob'
import { UI_CONFIG } from '@/constants/config'
import { GRADIENTS } from '@/constants/uiColors'
import { useAdBannerReserve } from '@/hooks/useAdBannerReserve'
import { useAdPlacementActive } from '@/hooks/useAdPlacementActive'
import { useInAppUpdate } from '@/hooks/useInAppUpdate'
import { useTabBarPadding } from '@/hooks/useTabBarPadding'
import { useSegments } from 'expo-router'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native'
import Animated, { FadeOutDown, SlideInDown } from 'react-native-reanimated'

const BANNER_GAP = 8
const CARD_GAP = 12

const TAB_BANNERS = {
  index: { unitId: ADMOB_INDEX_BANNER_ID, enabled: AD_BANNER_INDEX_ENABLED },
  settings: { unitId: ADMOB_SETTINGS_BANNER_ID, enabled: AD_BANNER_SETTINGS_ENABLED },
} as const

const isTabName = (name: string | undefined): name is keyof typeof TAB_BANNERS =>
  name !== undefined && name in TAB_BANNERS

export function AppUpdateCard() {
  const { t } = useTranslation()
  const { isReadyToRestart, restart, dismiss } = useInAppUpdate()
  const segments: readonly string[] = useSegments()
  const tab = isTabName(segments[1]) ? segments[1] : 'index'
  const isBannerVisible = useAdPlacementActive(TAB_BANNERS[tab])
  const bannerReserve = useAdBannerReserve({ isBannerVisible })
  const bottom = useTabBarPadding((isBannerVisible ? BANNER_GAP + bannerReserve : 0) + CARD_GAP)
  const title = t('appUpdate.ready.title')

  useEffect(() => {
    if (isReadyToRestart) AccessibilityInfo.announceForAccessibility(title)
  }, [isReadyToRestart, title])

  if (!isReadyToRestart) return null

  return (
    <Animated.View
      entering={SlideInDown.duration(260)}
      exiting={FadeOutDown.duration(200)}
      className="absolute inset-x-4 z-[9997] items-center"
      style={{ bottom }}>
      <View
        style={styles.card}
        className="w-full gap-3 rounded-[1.125rem] border border-gray-200 bg-white px-4 pb-2 pt-4 dark:border-gray-700 dark:bg-gray-800">
        <View className="gap-1">
          <ThemedText variant="subheading" accessibilityRole="header">
            {title}
          </ThemedText>
          <ThemedText variant="label" color="muted">
            {t('appUpdate.ready.body')}
          </ThemedText>
        </View>
        <GradientButton onPress={restart} colors={GRADIENTS.cta} style={styles.restartButton}>
          <ThemedText variant="button" color="inverse" align="center">
            {t('appUpdate.ready.restart')}
          </ThemedText>
        </GradientButton>
        <Pressable
          onPress={dismiss}
          accessibilityRole="button"
          className="min-h-[44px] items-center justify-center rounded-2xl px-3 active:opacity-70">
          <ThemedText variant="label" color="primary" weight="semibold" align="center">
            {t('appUpdate.ready.later')}
          </ThemedText>
        </Pressable>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    maxWidth: UI_CONFIG.MAX_CONTENT_WIDTH,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 14,
  },
  restartButton: {
    height: 52,
    borderRadius: 14,
  },
})
