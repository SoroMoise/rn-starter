import { ThemedText } from '@/components/ui/ThemedText'
import { ALERT_THEME } from '@/constants/alertTheme'
import type { AlertNotification } from '@/providers/AlertNotificationProvider'
import { useSettingsStore } from '@/stores/settingsStore'
import { formatAlertRate, formatRateLocalized } from '@/utils/formatters'
import { triggerLight, triggerSuccess } from '@/utils/haptics'
import { DirectionalIcon } from '@/components/ui/DirectionalIcon'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useThemedColor } from '@hooks/useThemedColor'
import React, { useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { scheduleOnRN } from 'react-native-worklets'

const AUTO_HIDE_MS = 10_000
const HIDDEN_OFFSET = -240

interface Props {
  notification: AlertNotification
  onDismiss: () => void
  onPress: () => void
}

export function AlertNotificationCard({ notification, onDismiss, onPress }: Props) {
  const { t, i18n } = useTranslation()
  const insets = useSafeAreaInsets()
  const isDark = useThemedColor()
  const decimals = useSettingsStore((s) => s.settings.decimals)

  const translateY = useSharedValue(HIDDEN_OFFSET)
  const opacity = useSharedValue(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const hide = useCallback(() => {
    cancelTimer()
    translateY.value = withTiming(HIDDEN_OFFSET, {
      duration: 220,
      easing: Easing.in(Easing.cubic),
    })
    opacity.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) scheduleOnRN(onDismiss)
    })
  }, [cancelTimer, onDismiss, opacity, translateY])

  const startTimer = useCallback(() => {
    timerRef.current = setTimeout(hide, AUTO_HIDE_MS)
  }, [hide])

  useEffect(() => {
    triggerSuccess()
    translateY.value = withSpring(0, { damping: 22, stiffness: 220, mass: 0.9 })
    opacity.value = withTiming(1, { duration: 280 })
    startTimer()
    return cancelTimer
  }, [notification.alertId, cancelTimer, startTimer, opacity, translateY])

  const panGesture = Gesture.Pan()
    .onBegin(() => runOnJS(cancelTimer)())
    .onChange((event) => {
      translateY.value = Math.min(0, event.translationY)
    })
    .onFinalize((event) => {
      if (event.translationY < -50 || event.velocityY < -400) {
        runOnJS(hide)()
      } else {
        translateY.value = withSpring(0, { damping: 22, stiffness: 220 })
        runOnJS(startTimer)()
      }
    })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }))

  const handlePress = () => {
    triggerLight()
    cancelTimer()
    onPress()
  }

  const pair = `${notification.fromCurrency} → ${notification.toCurrency}`
  let directionLabel: string
  if (notification.triggerType === 'threshold') {
    const formattedTarget = formatAlertRate({
      rate: notification.targetRate,
      decimals,
      locale: i18n.language,
    })
    directionLabel =
      notification.direction === 'above'
        ? t('alerts.cardDescAbove', { rate: formattedTarget })
        : t('alerts.cardDescBelow', { rate: formattedTarget })
  } else {
    const delta =
      ((notification.currentRate - notification.baselineRate) / notification.baselineRate) * 100
    directionLabel = t('alerts.cardDescVariation', {
      delta: formatRateLocalized({ rate: delta, decimals: 2, locale: i18n.language }),
      baseline: formatAlertRate({
        rate: notification.baselineRate,
        decimals,
        locale: i18n.language,
      }),
    })
  }

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          animatedStyle,
          {
            position: 'absolute',
            top: insets.top + 8,
            left: 12,
            right: 12,
            zIndex: 10000,
          },
        ]}>
        <Pressable
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel={`${pair}, ${directionLabel}`}
          className={`flex-row items-center gap-3 rounded-2xl px-4 py-3 ${
            isDark ? 'border border-gray-700 bg-gray-900/95' : 'border border-gray-200 bg-white/95'
          }`}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.18,
            shadowRadius: 14,
            elevation: 10,
          }}>
          <View className="h-11 w-11 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/40">
            <Ionicons name="notifications" size={22} color={ALERT_THEME.primary} />
          </View>
          <View className="flex-1">
            <ThemedText variant="label" weight="bold">
              {pair}
            </ThemedText>
            <ThemedText variant="caption" color="muted" numberOfLines={1}>
              {directionLabel}
            </ThemedText>
            <ThemedText
              variant="caption"
              weight="semibold"
              color="inherit"
              className="mt-0.5 text-amber-600 dark:text-amber-400">
              {t('alerts.cardCurrent', {
                rate: formatAlertRate({
                  rate: notification.currentRate,
                  decimals,
                  locale: i18n.language,
                }),
              })}
            </ThemedText>
          </View>
          <View className="h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <DirectionalIcon
              name="chevron-forward"
              size={15}
              color={isDark ? '#9ca3af' : '#6b7280'}
            />
          </View>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  )
}
