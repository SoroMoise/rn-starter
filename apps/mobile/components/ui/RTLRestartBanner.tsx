import { ThemedText } from '@/components/ui/ThemedText'
import { RTL_RESTART_BANNER_ENABLED } from '@/constants/config'
import { useSettingsStore } from '@/stores/settingsStore'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useThemedColor } from '@hooks/useThemedColor'
import { BlurView } from 'expo-blur'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, View } from 'react-native'
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
import { TAB_BAR_HEIGHT } from './PremiumTabBar'

const COUNTDOWN_SECONDS = 15

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function RTLRestartBanner() {
  const { t } = useTranslation()
  const isDark = useThemedColor()
  const rtlRestartNeeded = useSettingsStore((s) => s.rtlRestartNeeded)
  const rtlRestartTrigger = useSettingsStore((s) => s.rtlRestartTrigger)
  const clearRTLRestartNeeded = useSettingsStore((s) => s.clearRTLRestartNeeded)
  const insets = useSafeAreaInsets()

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

  const primary = isDark ? '#25A4FF' : '#2f95dc'
  const primaryMuted = isDark ? 'rgba(37,164,255,0.15)' : 'rgba(47,149,220,0.1)'
  const primaryBorder = isDark ? 'rgba(37,164,255,0.3)' : 'rgba(47,149,220,0.2)'
  const glassBorder = isDark ? 'rgba(180, 180, 180, 0.4)' : 'rgba(184, 179, 179, 0.4)'
  const glassBg = isDark ? 'rgba(10,18,35,0.65)' : 'rgba(240,247,255,0.55)'
  const trackBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

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

    setCount(COUNTDOWN_SECONDS)

    translateY.value = withSpring(0, { damping: 22, stiffness: 200, mass: 0.9 })
    opacity.value = withTiming(1, { duration: 250 })

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
  }, [
    rtlRestartNeeded,
    rtlRestartTrigger,
    opacity,
    progressBarWidth,
    startProgressAnim,
    translateY,
  ])

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

  return (
    <Animated.View
      style={[styles.wrapper, { bottom: insets.bottom + TAB_BAR_HEIGHT + 50 }, animatedStyle]}>
      {/* Shadow layer — separate from clip layer so shadow bleeds out */}
      <View
        style={[styles.shadowLayer, { shadowColor: primary, shadowOpacity: isDark ? 0.45 : 0.22 }]}>
        {/* Clip layer — overflow hidden for border radius on BlurView */}
        <View style={[styles.clipLayer, { borderColor: glassBorder }]}>
          <BlurView
            intensity={85}
            blurReductionFactor={10}
            tint={isDark ? 'dark' : 'light'}
            experimentalBlurMethod="dimezisBlurView">
            {/* Tint overlay on top of blur */}
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: glassBg }]} />

            <View style={styles.content}>
              {/* Header row */}
              <View style={styles.headerRow}>
                <View
                  style={[
                    styles.iconBubble,
                    { backgroundColor: primaryMuted, borderColor: primaryBorder },
                  ]}>
                  <Ionicons name="refresh-circle" size={18} color={primary} />
                </View>

                <ThemedText variant="subheading" style={styles.title}>
                  {t('rtlRestart.title')}
                </ThemedText>
              </View>

              {/* Message */}
              <ThemedText variant="label" color="muted" style={styles.message}>
                {t('rtlRestart.message', { count })}
              </ThemedText>

              {/* Progress bar */}
              <View
                onLayout={(e) => {
                  const width = e.nativeEvent.layout.width
                  barContainerWidth.current = width
                  if (pendingProgressAnim.current) {
                    pendingProgressAnim.current = false
                    startProgressAnim(width, animStartTime.current)
                  }
                }}
                style={[styles.progressTrack, { backgroundColor: trackBg }]}>
                <Animated.View
                  style={[styles.progressFill, { backgroundColor: primary }, progressBarStyle]}
                />
              </View>

              {/* Action buttons */}
              <View style={styles.buttonsRow}>
                <AnimatedPressable
                  onPress={restartApp}
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
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9998,
  },
  shadowLayer: {
    borderRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 14,
  },
  clipLayer: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
  },
  content: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    flex: 1,
  },
  countdownPill: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  message: {
    marginBottom: 12,
    paddingLeft: 44,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    marginBottom: 14,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
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
