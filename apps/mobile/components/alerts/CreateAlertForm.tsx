import { GradientButton } from '@/components/ui/GradientButton'
import { ModalBottomSheetScrollView } from '@/components/ui/ModalBottomSheet'
import { SlidingSelector } from '@/components/ui/SlidingSelector'
import { ThemedText } from '@/components/ui/ThemedText'
import { ALERT_THEME } from '@/constants/alertTheme'
import { getCurrencyByCode } from '@/constants/currencies'
import { useAlertHistoricalRates } from '@/hooks/useAlertHistoricalRates'
import { useToast } from '@/providers/ToastProvider'
import { useAlertsStore } from '@/stores/alertsStore'
import { useCurrencyStore } from '@/stores/currencyStore'
import { useSettingsStore } from '@/stores/settingsStore'
import type { RateAlert } from '@/types'
import { isThresholdAlert, isVariationAlert } from '@/types'
import { calculateCrossRate } from '@/utils/crossRate'
import { ALERT_RATE_DECIMALS, formatAlertRate } from '@/utils/formatters'
import { triggerError, triggerLight, triggerSuccess } from '@/utils/haptics'
import Ionicons from '@expo/vector-icons/Ionicons'
import { type ComponentRef, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Keyboard,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native'
import { AlertPairSelector } from './AlertPairSelector'
import { MiniRateChart } from './MiniRateChart'

type Props = {
  fromCurrency: string
  toCurrency: string
  onSuccess: () => void
  editingAlert?: RateAlert
  editablePair?: boolean
  onFromPress?: () => void
  onToPress?: () => void
  onSwap?: () => void
}

type Direction = 'above' | 'below'
type TriggerMode = 'threshold' | 'variation'

interface ThresholdPreset {
  key: string
  label: string
  direction: Direction
  compute: (currentRate: number) => number
}

const VARIATION_PRESETS = [1, 2, 3, 5]

const THRESHOLD_PRESETS: ThresholdPreset[] = [
  { key: 'minus3', label: '-3%', direction: 'below', compute: (cur) => cur * 0.97 },
  { key: 'minus1', label: '-1%', direction: 'below', compute: (cur) => cur * 0.99 },
  { key: 'plus1', label: '+1%', direction: 'above', compute: (cur) => cur * 1.01 },
  { key: 'plus3', label: '+3%', direction: 'above', compute: (cur) => cur * 1.03 },
]

function ThresholdPill({
  label,
  selected,
  disabled,
  onPress,
}: {
  label: string
  selected: boolean
  disabled: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      className={`rounded-full px-3.5 py-1.5 ${
        disabled
          ? 'bg-gray-100 dark:bg-gray-800'
          : selected
            ? 'bg-amber-500'
            : 'bg-amber-50 dark:bg-amber-900/30'
      }`}>
      <ThemedText
        variant="caption"
        weight="semibold"
        color="inherit"
        className={
          disabled
            ? 'text-gray-400 dark:text-gray-500'
            : selected
              ? 'text-white'
              : 'text-amber-700 dark:text-amber-300'
        }>
        {label}
      </ThemedText>
    </TouchableOpacity>
  )
}

export function CreateAlertForm({
  fromCurrency,
  toCurrency,
  onSuccess,
  editingAlert,
  editablePair = false,
  onFromPress,
  onToPress,
  onSwap,
}: Props) {
  const { t, i18n } = useTranslation()
  const { width: screenWidth } = useWindowDimensions()
  // Account for the scroll content padding (24×2) plus the chart card padding (12×2).
  const chartWidth = screenWidth - 72

  const { showToast } = useToast()
  const createAlert = useAlertsStore((s) => s.createAlert)
  const editAlert = useAlertsStore((s) => s.editAlert)
  const rates = useCurrencyStore((s) => s.rates)
  const decimals = useSettingsStore((s) => s.settings.decimals)
  const rateDecimals = Math.max(decimals, ALERT_RATE_DECIMALS)

  const isEditing = editingAlert != null

  const [mode, setMode] = useState<TriggerMode>(editingAlert?.triggerType ?? 'threshold')
  const [direction, setDirection] = useState<Direction>(
    editingAlert && isThresholdAlert(editingAlert) ? editingAlert.direction : 'above'
  )
  const [targetRate, setTargetRate] = useState(
    editingAlert && isThresholdAlert(editingAlert) ? String(editingAlert.targetRate) : ''
  )
  const [variationPercent, setVariationPercent] = useState(
    editingAlert && isVariationAlert(editingAlert) ? String(editingAlert.variationPercent) : '2'
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scrollRef = useRef<ComponentRef<typeof ModalBottomSheetScrollView>>(null)
  const inputFocusedRef = useRef(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'
    const showSub = Keyboard.addListener(showEvt, (e) => setKeyboardHeight(e.endCoordinates.height))
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardHeight(0))
    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  // Once the keyboard pushes its inset in, bring the focused field (and the
  // submit button right below it) above the keyboard. Guarded so the keyboard
  // opened by a nested sheet (e.g. the currency picker search) doesn't scroll
  // this form behind it.
  useEffect(() => {
    if (keyboardHeight <= 0 || !inputFocusedRef.current) return
    const id = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50)
    return () => clearTimeout(id)
  }, [keyboardHeight])

  const pair = `${fromCurrency}/${toCurrency}`

  const currentRate =
    rates != null
      ? calculateCrossRate({ rates: rates.rates, from: fromCurrency, to: toCurrency })
      : null

  // Variation edits keep the baseline locked at creation (the user only adjusts
  // the sensitivity); creation uses the current rate as baseline.
  const effectiveBaseline =
    editingAlert && isVariationAlert(editingAlert) ? editingAlert.baselineRate : currentRate

  const {
    rates: historicalRates,
    statistics,
    isLoading: chartLoading,
  } = useAlertHistoricalRates({
    fromCurrency,
    toCurrency,
  })

  const modeOptions = useMemo(
    () => [
      { value: 'threshold' as const, label: t('alerts.modeThreshold') },
      { value: 'variation' as const, label: t('alerts.modeVariation') },
    ],
    [t]
  )

  const directionOptions = useMemo(
    () => [
      { value: 'above' as const, label: `↑ ${t('alerts.above')}` },
      { value: 'below' as const, label: `↓ ${t('alerts.below')}` },
    ],
    [t]
  )

  useEffect(() => {
    if (!isEditing && currentRate != null && targetRate === '') {
      setTargetRate(currentRate.toFixed(rateDecimals))
    }
  }, [isEditing, currentRate, targetRate, rateDecimals])

  // When the user swaps the pair while creating, the prefilled target rate from
  // the previous pair is stale — resync it to the new pair's current rate.
  const prevPairRef = useRef(pair)
  useEffect(() => {
    if (isEditing || prevPairRef.current === pair) return
    prevPairRef.current = pair
    setError(null)
    setTargetRate(currentRate != null ? currentRate.toFixed(rateDecimals) : '')
  }, [pair, isEditing, currentRate, rateDecimals])

  const parsedTarget = parseFloat(targetRate)
  const targetForChart = mode === 'threshold' && Number.isFinite(parsedTarget) ? parsedTarget : null

  const parsedVariation = parseFloat(variationPercent)
  const variationForChart =
    mode === 'variation' && effectiveBaseline != null && Number.isFinite(parsedVariation)
      ? { baselineRate: effectiveBaseline, variationPercent: parsedVariation }
      : null

  const applyThresholdPreset = (preset: ThresholdPreset) => {
    if (currentRate == null) return
    triggerLight()
    setTargetRate(preset.compute(currentRate).toFixed(rateDecimals))
    setDirection(preset.direction)
    setError(null)
  }

  const applyExtreme = (kind: 'min' | 'max') => {
    if (statistics == null) return
    triggerLight()
    const rate = kind === 'min' ? statistics.min : statistics.max
    setTargetRate(rate.toFixed(rateDecimals))
    setDirection(kind === 'min' ? 'below' : 'above')
    setError(null)
  }

  const applyVariationPreset = (percent: number) => {
    triggerLight()
    setVariationPercent(String(percent))
    setError(null)
  }

  const handleSubmit = async () => {
    if (mode === 'threshold') {
      const parsed = parseFloat(targetRate)
      if (isNaN(parsed) || parsed <= 0) {
        triggerError()
        setError(t('error.invalidAmount'))
        return
      }
      setError(null)
      setIsSubmitting(true)
      try {
        const params = { fromCurrency, toCurrency, direction, targetRate: parsed } as const
        if (editingAlert) await editAlert({ alertId: editingAlert.id, params })
        else await createAlert(params)
        triggerSuccess()
        showToast({
          message: editingAlert
            ? t('alerts.updateSuccess', { pair })
            : t(direction === 'above' ? 'alerts.createSuccessAbove' : 'alerts.createSuccessBelow', {
                pair,
                rate: formatAlertRate({ rate: parsed, decimals, locale: i18n.language }),
              }),
          type: 'success',
        })
        onSuccess()
      } catch (err) {
        triggerError()
        showToast({
          message: err instanceof Error ? err.message : t('error.unknownError'),
          type: 'error',
        })
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    const parsed = parseFloat(variationPercent)
    if (isNaN(parsed) || parsed <= 0 || parsed > 50) {
      triggerError()
      setError(t('alerts.invalidVariationPercent'))
      return
    }
    if (effectiveBaseline == null || effectiveBaseline <= 0) {
      triggerError()
      setError(t('alerts.invalidBaselineRate'))
      return
    }
    setError(null)
    setIsSubmitting(true)
    try {
      const params = {
        triggerType: 'variation',
        fromCurrency,
        toCurrency,
        variationPercent: parsed,
        baselineRate: effectiveBaseline,
      } as const
      if (editingAlert) await editAlert({ alertId: editingAlert.id, params })
      else await createAlert(params)
      triggerSuccess()
      showToast({
        message: editingAlert
          ? t('alerts.updateSuccess', { pair })
          : t('alerts.createSuccessVariation', { pair, percent: variationPercent }),
        type: 'success',
      })
      onSuccess()
    } catch (err) {
      triggerError()
      showToast({
        message: err instanceof Error ? err.message : t('error.unknownError'),
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const thresholdPresetsDisabled = currentRate == null || statistics == null
  const selectedThresholdKey = useMemo(() => {
    if (currentRate == null) return null
    for (const p of THRESHOLD_PRESETS) {
      if (
        direction === p.direction &&
        targetRate === p.compute(currentRate).toFixed(rateDecimals)
      ) {
        return p.key
      }
    }
    if (statistics) {
      if (direction === 'below' && targetRate === statistics.min.toFixed(rateDecimals)) return 'min'
      if (direction === 'above' && targetRate === statistics.max.toFixed(rateDecimals)) return 'max'
    }
    return null
  }, [currentRate, statistics, direction, targetRate, rateDecimals])
  const thresholdAlreadyMet =
    mode === 'threshold' &&
    currentRate != null &&
    Number.isFinite(parsedTarget) &&
    ((direction === 'above' && parsedTarget < currentRate) ||
      (direction === 'below' && parsedTarget > currentRate))
  const submitDisabled =
    isSubmitting || (mode === 'threshold' ? targetRate.length === 0 : variationPercent.length === 0)

  return (
    <ModalBottomSheetScrollView
      ref={scrollRef}
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingTop: 4,
        paddingBottom: 32 + keyboardHeight,
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag">
      {editablePair && (
        <AlertPairSelector
          fromCurrency={{ ...getCurrencyByCode(fromCurrency), isFavorite: false }}
          toCurrency={{ ...getCurrencyByCode(toCurrency), isFavorite: false }}
          onFromPress={() => onFromPress?.()}
          onToPress={() => onToPress?.()}
          onSwap={() => onSwap?.()}
        />
      )}

      <View className="mb-4 rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60">
        {historicalRates.length >= 2 ? (
          <>
            <MiniRateChart
              data={historicalRates}
              targetRate={targetForChart}
              variationZone={variationForChart}
              width={chartWidth}
              height={80}
            />
            {statistics && (
              <View className="mt-2 flex-row justify-between">
                <ThemedText variant="caption" color="muted">
                  {t('statistics.min')}:{' '}
                  {formatAlertRate({ rate: statistics.min, decimals, locale: i18n.language })}
                </ThemedText>
                <ThemedText variant="caption" color="muted">
                  {t('statistics.max')}:{' '}
                  {formatAlertRate({ rate: statistics.max, decimals, locale: i18n.language })}
                </ThemedText>
              </View>
            )}
          </>
        ) : (
          <View style={{ height: 80, justifyContent: 'center', alignItems: 'center' }}>
            <ThemedText variant="caption" color="muted">
              {chartLoading ? t('common.loading') : t('alerts.chartUnavailable')}
            </ThemedText>
          </View>
        )}
      </View>

      {!isEditing && (
        <View className="mb-4">
          <SlidingSelector options={modeOptions} value={mode} onChange={setMode} variant="blue" />
        </View>
      )}

      {mode === 'threshold' ? (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}
            className="mb-4">
            {THRESHOLD_PRESETS.map((preset) => (
              <ThresholdPill
                key={preset.key}
                label={preset.label}
                selected={selectedThresholdKey === preset.key}
                disabled={thresholdPresetsDisabled}
                onPress={() => applyThresholdPreset(preset)}
              />
            ))}
            <ThresholdPill
              label={t('alerts.presetMin')}
              selected={selectedThresholdKey === 'min'}
              disabled={thresholdPresetsDisabled}
              onPress={() => applyExtreme('min')}
            />
            <ThresholdPill
              label={t('alerts.presetMax')}
              selected={selectedThresholdKey === 'max'}
              disabled={thresholdPresetsDisabled}
              onPress={() => applyExtreme('max')}
            />
          </ScrollView>

          <View className="mb-4">
            <ThemedText variant="label" color="muted" className="mb-2">
              {t('alerts.direction')}
            </ThemedText>
            <SlidingSelector
              options={directionOptions}
              value={direction}
              onChange={setDirection}
              variant="blue"
            />
          </View>

          <View className="mb-4">
            <ThemedText variant="label" color="muted" className="mb-2">
              {t('alerts.targetRate')}
            </ThemedText>
            {currentRate != null && (
              <ThemedText variant="caption" color="muted" className="mb-1">
                {t('alerts.currentRate', {
                  rate: formatAlertRate({ rate: currentRate, decimals, locale: i18n.language }),
                })}
              </ThemedText>
            )}
            <TextInput
              value={targetRate}
              onChangeText={(v) => {
                setTargetRate(v)
                setError(null)
              }}
              onFocus={() => {
                inputFocusedRef.current = true
                scrollRef.current?.scrollToEnd({ animated: true })
              }}
              onBlur={() => {
                inputFocusedRef.current = false
              }}
              keyboardType="decimal-pad"
              placeholder="0.0000"
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {thresholdAlreadyMet && (
              <View className="mt-2 flex-row items-start gap-1.5">
                <Ionicons
                  name="information-circle-outline"
                  size={13}
                  color={ALERT_THEME.primaryDark}
                  style={{ marginTop: 1 }}
                />
                <ThemedText
                  variant="caption"
                  color="inherit"
                  className="flex-1 text-amber-700 dark:text-amber-400">
                  {t('alerts.thresholdAlreadyMet')}
                </ThemedText>
              </View>
            )}
          </View>
        </>
      ) : (
        <>
          <View className="mb-4 flex-row flex-wrap gap-2">
            {VARIATION_PRESETS.map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => applyVariationPreset(p)}
                activeOpacity={0.7}
                accessibilityRole="button"
                className={`rounded-full px-3.5 py-1.5 ${
                  parseFloat(variationPercent) === p
                    ? 'bg-amber-500'
                    : 'bg-amber-50 dark:bg-amber-900/30'
                }`}>
                <ThemedText
                  variant="caption"
                  weight="semibold"
                  color="inherit"
                  className={
                    parseFloat(variationPercent) === p
                      ? 'text-white'
                      : 'text-amber-700 dark:text-amber-300'
                  }>
                  ±{p}%
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          <View className="mb-4">
            <ThemedText variant="label" color="muted" className="mb-2">
              {t('alerts.variationPercentLabel')}
            </ThemedText>
            {effectiveBaseline != null && (
              <ThemedText variant="caption" color="muted" className="mb-1">
                {t('alerts.variationBaselineInfo', {
                  rate: formatAlertRate({
                    rate: effectiveBaseline,
                    decimals,
                    locale: i18n.language,
                  }),
                })}
              </ThemedText>
            )}
            <View className="flex-row items-center gap-2">
              <TextInput
                value={variationPercent}
                onChangeText={(v) => {
                  setVariationPercent(v)
                  setError(null)
                }}
                onFocus={() => {
                  inputFocusedRef.current = true
                  scrollRef.current?.scrollToEnd({ animated: true })
                }}
                onBlur={() => {
                  inputFocusedRef.current = false
                }}
                keyboardType="decimal-pad"
                placeholder="2.0"
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <ThemedText variant="label" weight="semibold" color="muted">
                %
              </ThemedText>
            </View>
          </View>
        </>
      )}

      {error != null && (
        <ThemedText variant="caption" color="error" className="mb-2">
          {error}
        </ThemedText>
      )}

      <GradientButton
        onPress={handleSubmit}
        colors={ALERT_THEME.gradient}
        disabled={submitDisabled}
        isLoading={isSubmitting}>
        <ThemedText variant="button" color="inverse">
          {isEditing ? t('alerts.save') : t('alerts.create')}
        </ThemedText>
      </GradientButton>
    </ModalBottomSheetScrollView>
  )
}
