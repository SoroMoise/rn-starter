import { ThemedText } from '@/components/ui/ThemedText'
import { RTL_RESTART_BANNER_ENABLED } from '@/constants/config'
import { UI_COLORS } from '@/constants/uiColors'
import { useScreenReaderEnabled } from '@/hooks/useScreenReaderEnabled'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { useSettingsStore } from '@/stores/settingsStore'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useThemedColor } from '@hooks/useThemedColor'
import { BlurView } from 'expo-blur'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AccessibilityInfo, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import RNRestart from 'react-native-restart'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { tabBarHeight } from './PremiumTabBar'

const COUNTDOWN_SECONDS = 15
const TAB_BAR_CLEARANCE = 50
const ONBOARDING_CLEARANCE = 16

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function RTLRestartBanner() {
  const { t } = useTranslation()
  const isDark = useThemedColor()
  const rtlRestartNeeded = useSettingsStore((s) => s.rtlRestartNeeded)
  const rtlRestartTrigger = useSettingsStore((s) => s.rtlRestartTrigger)
  const clearRTLRestartNeeded = useSettingsStore((s) => s.clearRTLRestartNeeded)
  const isOnboardingCompleted = useOnboardingStore((s) => s.isCompleted)
  const insets = useSafeAreaInsets()
  const { fontScale } = useWindowDimensions()
  const isManual = useScreenReaderEnabled()
  const tRef = useRef(t)
  tRef.current = t

  const [count, setCount] = useState(COUNTDOWN_SECONDS)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const barContainerWidth = useRef(0)
  const animStartTime = useRef(0)
  const pendingProgressAnim = useRef(false)

  const translateY = useSharedValue(200)
  const opacity = useSharedValue(0)
  const progressBarWidth = useSharedValue(0)
  const restartScale = useSharedValue(1)
  const dismissScale = useSharedValue(1)

  const primary = isDark ? UI_COLORS.accent[400] : UI_COLORS.accent[500]

  const startProgressAnim = useCallback(
    (containerWidth: number, startedAt: number) => {
      const elapsed = Date.now() - startedAt
      const remaining = Math.max(COUNTDOWN_SECONDS * 1000 - elapsed, 0)
      progressBarWidth.value = (remaining / (COUNTDOWN_SECONDS * 1000)) * containerWidth
      progressBarWidth.value = withTiming(0, { duration: remaining, easing: Easing.linear })
    },
    [progressBarWidth]
  )

  const restartApp = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    RNRestart.restart()
  }, [])

  const dismiss = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    cancelAnimation(progressBarWidth)
    translateY.value = withTiming(200, { duration: 280 }, (finished) => {
      if (finished) runOnJS(clearRTLRestartNeeded)()
    })
    opacity.value = withTiming(0, { duration: 220 })
  }, [clearRTLRestartNeeded, opacity, progressBarWidth, translateY])

  useEffect(() => {
    if (!rtlRestartNeeded || !RTL_RESTART_BANNER_ENABLED) return
    translateY.value = withSpring(0, { damping: 22, stiffness: 200, mass: 0.9 })
    opacity.value = withTiming(1, { duration: 250 })
    AccessibilityInfo.announceForAccessibility(tRef.current('rtlRestart.announcement'))
  }, [rtlRestartNeeded, rtlRestartTrigger, opacity, translateY])

  useEffect(() => {
    if (!rtlRestartNeeded || !RTL_RESTART_BANNER_ENABLED || isManual) return

    setCount(COUNTDOWN_SECONDS)
    cancelAnimation(progressBarWidth)
    animStartTime.current = Date.now()

    if (barContainerWidth.current > 0) {
      pendingProgressAnim.current = false
      startProgressAnim(barContainerWidth.current, animStartTime.current)
    } else {
      pendingProgressAnim.current = true
      progressBarWidth.value = 0
    }

    intervalRef.current = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          RNRestart.restart()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      cancelAnimation(progressBarWidth)
    }
  }, [rtlRestartNeeded, rtlRestartTrigger, isManual, progressBarWidth, startProgressAnim])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }))

  const progressBarStyle = useAnimatedStyle(() => ({
    width: progressBarWidth.value,
  }))

  const restartBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: restartScale.value }],
  }))

  const dismissBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dismissScale.value }],
  }))

  const pressIn = (scale: SharedValue<number>) => {
    scale.value = withTiming(0.95, { duration: 120, easing: Easing.out(Easing.quad) })
  }

  const pressOut = (scale: SharedValue<number>) => {
    scale.value = withSpring(1, { damping: 12, stiffness: 320, mass: 0.6 })
  }

  if (!rtlRestartNeeded || !RTL_RESTART_BANNER_ENABLED) return null

  const bottom = isOnboardingCompleted
    ? insets.bottom + tabBarHeight(fontScale) + TAB_BAR_CLEARANCE
    : insets.bottom + ONBOARDING_CLEARANCE

  return (
    <Animated.View className="absolute inset-x-4 z-[9998]" style={[{ bottom }, animatedStyle]}>
      {/* Shadow layer — separate from clip layer so shadow bleeds out */}
      <View
        className="rounded-3xl"
        style={[styles.shadowLayer, { shadowColor: primary, shadowOpacity: isDark ? 0.45 : 0.22 }]}>
        {/* Clip layer — overflow hidden for border radius on BlurView */}
        <View className="overflow-hidden rounded-3xl border border-[#b8b3b3]/40 dark:border-[#b4b4b4]/40">
          <BlurView
            intensity={85}
            blurReductionFactor={10}
            tint={isDark ? 'dark' : 'light'}
            experimentalBlurMethod="dimezisBlurView">
            <View className="absolute inset-0 bg-[#f0f7ff]/[0.55] dark:bg-[#0a1223]/[0.65]" />

            <View className="p-4">
              <View className="mb-2 flex-row items-center">
                <View className="mr-2.5 h-[34px] w-[34px] items-center justify-center rounded-full border border-accent-500/20 bg-accent-500/10 dark:border-accent-400/30 dark:bg-accent-400/15">
                  <Ionicons
                    name="refresh-circle"
                    size={18}
                    color={primary}
                    importantForAccessibility="no"
                  />
                </View>

                <ThemedText variant="subheading" accessibilityRole="header" className="flex-1">
                  {t('rtlRestart.title')}
                </ThemedText>
              </View>

              <ThemedText variant="label" color="muted" className="mb-3 pl-11">
                {isManual ? t('rtlRestart.messageManual') : t('rtlRestart.message', { count })}
              </ThemedText>

              {isManual ? null : (
                <View
                  importantForAccessibility="no-hide-descendants"
                  onLayout={(e) => {
                    const width = e.nativeEvent.layout.width
                    barContainerWidth.current = width
                    if (pendingProgressAnim.current) {
                      pendingProgressAnim.current = false
                      startProgressAnim(width, animStartTime.current)
                    }
                  }}
                  className="mb-3.5 h-[3px] overflow-hidden rounded-sm bg-black/[0.08] dark:bg-white/[0.08]">
                  <Animated.View
                    className="h-full rounded-sm bg-accent-500 dark:bg-accent-400"
                    style={progressBarStyle}
                  />
                </View>
              )}

              <View className="flex-row gap-2.5">
                <AnimatedPressable
                  onPress={restartApp}
                  accessibilityRole="button"
                  onPressIn={() => pressIn(restartScale)}
                  onPressOut={() => pressOut(restartScale)}
                  style={[
                    styles.btnPrimary,
                    {
                      backgroundColor: primary,
                      borderColor: isDark ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.5)',
                      shadowColor: primary,
                      shadowOpacity: isDark ? 0.5 : 0.35,
                    },
                    restartBtnStyle,
                  ]}>
                  <ThemedText variant="label" weight="semibold" color="inverse">
                    {t('rtlRestart.restartNow')}
                  </ThemedText>
                </AnimatedPressable>

                <AnimatedPressable
                  onPress={dismiss}
                  accessibilityRole="button"
                  onPressIn={() => pressIn(dismissScale)}
                  onPressOut={() => pressOut(dismissScale)}
                  style={[
                    styles.btnSecondary,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      borderColor: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.1)',
                    },
                    dismissBtnStyle,
                  ]}>
                  <ThemedText variant="label" weight="medium">
                    {t('rtlRestart.restartManually')}
                  </ThemedText>
                </AnimatedPressable>
              </View>
            </View>
          </BlurView>
        </View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  shadowLayer: {
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 14,
  },
  btnPrimary: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  btnSecondary: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
  },
})
