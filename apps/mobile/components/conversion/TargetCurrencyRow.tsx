import { ThemedText } from '@/components/ui/ThemedText'
import { ALERT_THEME } from '@/constants/alertTheme'
import { analyticsService } from '@/services/api/analyticsService'
import { useAlertsStore } from '@/stores/alertsStore'
import { useSettingsStore } from '@/stores/settingsStore'
import type { Currency, Language } from '@/types'
import { getCurrencyName } from '@/utils/currency'
import { formatAmount, formatRateLocalized } from '@/utils/formatters'
import { triggerLight, triggerMedium, triggerSuccess } from '@/utils/haptics'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useThemedColor } from '@hooks/useThemedColor'
import { setStringAsync } from 'expo-clipboard'
import React, { useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Animated as RNAnimated, TouchableOpacity, View } from 'react-native'
import { Swipeable } from 'react-native-gesture-handler'
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { TargetCurrencyResult } from './TargetCurrencyResult'

const DELETE_ANIMATION_DURATION = 280

interface TargetCurrencyRowProps {
  currency: Currency
  result: number
  rate: number
  fromCurrencyCode: string
  onPress: () => void
  onLongPress?: () => void
  onDelete?: () => void
  onAlertPress?: () => void
  canDelete?: boolean
  isActive?: boolean
  onSwipeOpen?: (swipeable: Swipeable) => void
  onSwipeClose?: (swipeable: Swipeable) => void
}

export const TargetCurrencyRow = React.memo(
  function TargetCurrencyRow({
    currency,
    result,
    rate,
    fromCurrencyCode,
    onPress,
    onLongPress,
    onDelete,
    onAlertPress,
    canDelete = true,
    isActive,
    onSwipeOpen,
    onSwipeClose,
  }: TargetCurrencyRowProps) {
    const { t, i18n } = useTranslation()
    const isDark = useThemedColor()
    const decimals = useSettingsStore((s) => s.settings.decimals)
    const thousandSeparator = useSettingsStore((s) => s.settings.thousandSeparator)
    const swipeableRef = useRef<Swipeable>(null)
    const hasActiveAlert = useAlertsStore((s) =>
      s.alerts.some(
        (a) => a.isActive && a.fromCurrency === fromCurrencyCode && a.toCurrency === currency.code
      )
    )

    const deleteProgress = useSharedValue(1)

    const formattedResult = useMemo(
      () =>
        formatAmount({
          amount: result,
          decimals,
          useSeparator: thousandSeparator,
          locale: i18n.language,
        }),
      [result, decimals, thousandSeparator, i18n.language]
    )

    const formattedRate = useMemo(
      () =>
        `1 ${fromCurrencyCode} = ${formatRateLocalized({ rate, decimals, locale: i18n.language })} ${currency.symbol}`,
      [fromCurrencyCode, rate, decimals, currency.symbol, i18n.language]
    )

    const handlePress = useCallback(() => {
      triggerLight()
      onPress()
    }, [onPress])

    const handleCopy = useCallback(async () => {
      try {
        await setStringAsync(result.toFixed(decimals))
        triggerSuccess()
        analyticsService.track('conversion_result_copied', {
          currency_code: currency.code,
          from_currency_code: fromCurrencyCode,
        })
      } catch (error) {
        console.warn('[TargetCurrencyRow] Failed to copy:', error)
      }
    }, [result, decimals, currency.code, fromCurrencyCode])

    const handleAlert = useCallback(() => {
      if (!onAlertPress) return
      triggerLight()
      onAlertPress()
    }, [onAlertPress])

    const executeDelete = useCallback(() => {
      onDelete?.()
    }, [onDelete])

    const handleDelete = useCallback(() => {
      swipeableRef.current?.close()
      triggerMedium()

      deleteProgress.value = withTiming(
        0,
        {
          duration: DELETE_ANIMATION_DURATION,
          easing: Easing.out(Easing.cubic),
        },
        (finished) => {
          if (finished) {
            runOnJS(executeDelete)()
          }
        }
      )
    }, [deleteProgress, executeDelete])

    const deleteAnimatedStyle = useAnimatedStyle(() => ({
      opacity: deleteProgress.value,
      transform: [{ scale: 0.95 + deleteProgress.value * 0.05 }],
    }))

    const handleSwipeOpen = useCallback(() => {
      if (swipeableRef.current) {
        onSwipeOpen?.(swipeableRef.current)
      }
    }, [onSwipeOpen])

    const handleSwipeClose = useCallback(() => {
      if (swipeableRef.current) {
        onSwipeClose?.(swipeableRef.current)
      }
    }, [onSwipeClose])

    const renderRightActions = useCallback(
      (
        _progress: RNAnimated.AnimatedInterpolation<number>,
        dragX: RNAnimated.AnimatedInterpolation<number>
      ) => {
        if (!canDelete) return null

        const scale = dragX.interpolate({
          inputRange: [-80, 0],
          outputRange: [1, 0.5],
          extrapolate: 'clamp',
        })

        return (
          <TouchableOpacity
            onPress={handleDelete}
            className="items-center justify-center rounded-r-xl bg-red-500 px-5"
            activeOpacity={0.8}>
            <RNAnimated.View style={{ transform: [{ scale }] }}>
              <Ionicons name="trash-outline" size={20} color="white" />
            </RNAnimated.View>
          </TouchableOpacity>
        )
      },
      [canDelete, handleDelete]
    )

    const rowContent = (
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={onLongPress}
        activeOpacity={0.7}
        className={`flex-row items-center rounded-xl px-3 py-3 ${
          isActive ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'bg-white dark:bg-gray-800'
        }`}
        style={
          isActive
            ? { shadowColor: '#00000099', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }
            : undefined
        }
        accessibilityRole="button"
        accessibilityLabel={`${currency.code} ${formattedResult} ${currency.symbol}`}>
        <View className="mr-2 justify-center">
          <Ionicons name="reorder-three" size={18} color={isDark ? '#4b5563' : '#d0d0d0'} />
        </View>

        <View className="mr-3 flex-row items-center gap-2.5">
          <ThemedText color="inherit" className="text-xl">
            {currency.flag}
          </ThemedText>
          <View className="shrink">
            <View className="flex-row items-center gap-1">
              <ThemedText variant="label" weight="bold" color="dimmed">
                {getCurrencyName(currency, i18n.language as Language)}
              </ThemedText>
              <ThemedText
                variant="label"
                color="inherit"
                weight="normal"
                className="text-gray-400 dark:text-gray-200">
                -
              </ThemedText>
              <ThemedText variant="label" weight="bold">
                {currency.code}
              </ThemedText>
            </View>
            <ThemedText variant="caption" color="muted" className="text-[12px]" numberOfLines={1}>
              {formattedRate}
            </ThemedText>
          </View>
        </View>

        <View className="flex-1 flex-row items-center justify-end gap-1">
          <TargetCurrencyResult
            value={result}
            formatted={formattedResult}
            decimals={decimals}
            useSeparator={thousandSeparator}
            locale={i18n.language}
            isDark={isDark}
          />
          {onAlertPress && (
            <TouchableOpacity
              onPress={handleAlert}
              hitSlop={{ top: 10, bottom: 10 }}
              className="p-2"
              accessibilityRole="button"
              accessibilityLabel={t('a11y.alertsFor', { currency: currency.code })}>
              <Ionicons
                name={hasActiveAlert ? 'notifications' : 'notifications-outline'}
                size={16}
                color={
                  hasActiveAlert
                    ? ALERT_THEME.primary
                    : isDark
                      ? ALERT_THEME.iconInactiveDark
                      : ALERT_THEME.iconInactive
                }
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleCopy}
            hitSlop={{ top: 10, bottom: 10 }}
            className="p-2"
            accessibilityRole="button"
            accessibilityLabel={t('a11y.copyValue', { currency: currency.code })}>
            <Ionicons name="copy-outline" size={14} color={isDark ? '#B5BBC6' : '#6b7280'} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    )

    const wrappedContent = canDelete ? (
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        onSwipeableOpenStartDrag={handleSwipeOpen}
        onSwipeableClose={handleSwipeClose}
        overshootRight={false}
        friction={2}>
        {rowContent}
      </Swipeable>
    ) : (
      rowContent
    )

    return (
      <Animated.View style={[{ overflow: 'hidden', marginHorizontal: 12 }, deleteAnimatedStyle]}>
        {wrappedContent}
      </Animated.View>
    )
  },
  (prev, next) =>
    prev.result === next.result &&
    prev.rate === next.rate &&
    prev.currency.code === next.currency.code &&
    prev.fromCurrencyCode === next.fromCurrencyCode &&
    prev.isActive === next.isActive &&
    prev.canDelete === next.canDelete &&
    prev.onPress === next.onPress &&
    prev.onLongPress === next.onLongPress &&
    prev.onDelete === next.onDelete &&
    prev.onAlertPress === next.onAlertPress &&
    prev.onSwipeOpen === next.onSwipeOpen &&
    prev.onSwipeClose === next.onSwipeClose
)
