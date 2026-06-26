import { ThemedText } from '@/components/ui/ThemedText'
import { ALERT_THEME } from '@/constants/alertTheme'
import { getCurrencyByCode } from '@/constants/currencies'
import { useCurrencyStore } from '@/stores/currencyStore'
import { useSettingsStore } from '@/stores/settingsStore'
import type { RateAlert } from '@/types'
import { isThresholdAlert, isVariationAlert } from '@/types'
import { calculateCrossRate } from '@/utils/crossRate'
import { formatAlertRate, formatRateLocalized } from '@/utils/formatters'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

type Props = {
  alert: RateAlert
  onDelete: () => void
  onEdit?: () => void
  hideStatusBadge?: boolean
}

type ProximityTier = 'imminent' | 'close' | 'near' | 'far'

interface ProximityInfo {
  tier: ProximityTier
  percent: number
}

function classifyProximity(distancePercent: number): ProximityInfo {
  if (distancePercent <= 0) return { tier: 'imminent', percent: 0 }
  if (distancePercent < 1) return { tier: 'close', percent: distancePercent }
  if (distancePercent < 3) return { tier: 'near', percent: distancePercent }
  return { tier: 'far', percent: distancePercent }
}

function computeProximity(alert: RateAlert, currentRate: number): ProximityInfo | null {
  if (isThresholdAlert(alert)) {
    const remaining =
      alert.direction === 'above' ? alert.targetRate - currentRate : currentRate - alert.targetRate
    if (remaining <= 0) return { tier: 'imminent', percent: 0 }
    return classifyProximity((remaining / currentRate) * 100)
  }
  if (isVariationAlert(alert)) {
    if (alert.baselineRate <= 0) return null
    const upper = alert.baselineRate * (1 + alert.variationPercent / 100)
    const lower = alert.baselineRate * (1 - alert.variationPercent / 100)
    if (currentRate >= upper || currentRate <= lower) return { tier: 'imminent', percent: 0 }
    const distUp = ((upper - currentRate) / currentRate) * 100
    const distDown = ((currentRate - lower) / currentRate) * 100
    return classifyProximity(Math.min(distUp, distDown))
  }
  return null
}

const TIER_STYLES: Record<ProximityTier, { dot: string; text: string; bg: string }> = {
  imminent: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
  close: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
  near: {
    dot: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
  },
  far: {
    dot: 'bg-gray-400',
    text: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-100 dark:bg-gray-700/50',
  },
}

export function AlertListItem({ alert, onDelete, onEdit, hideStatusBadge = false }: Props) {
  const { t, i18n } = useTranslation()
  const from = getCurrencyByCode(alert.fromCurrency)
  const to = getCurrencyByCode(alert.toCurrency)
  const rates = useCurrencyStore((s) => s.rates)
  const decimals = useSettingsStore((s) => s.settings.decimals)

  // Editing targets active, already-synced alerts: triggered ones use "recreate",
  // and a temp id has no server record to PATCH yet.
  const canEdit = onEdit != null && alert.isActive && !alert.id.startsWith('temp-')

  const proximity = useMemo(() => {
    if (!alert.isActive || !rates) return null
    const currentRate = calculateCrossRate({
      rates: rates.rates,
      from: alert.fromCurrency,
      to: alert.toCurrency,
    })
    if (currentRate == null) return null
    return computeProximity(alert, currentRate)
  }, [alert, rates])

  const proximityLabel = proximity
    ? proximity.tier === 'imminent'
      ? t('alerts.imminentTrigger')
      : t('alerts.proximity', {
          percent: formatRateLocalized({
            rate: proximity.percent,
            decimals: proximity.percent < 1 ? 2 : 1,
            locale: i18n.language,
          }),
        })
    : null

  const tierStyle = proximity ? TIER_STYLES[proximity.tier] : null

  return (
    <View className="mb-2 rounded-xl bg-white p-2 dark:bg-gray-800">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <ThemedText variant="label" weight="semibold">
            {from.flag} {alert.fromCurrency} / {to.flag} {alert.toCurrency}
          </ThemedText>
          <View className="mt-0.5 flex-row items-center gap-1">
            {isThresholdAlert(alert) ? (
              <>
                <Ionicons
                  name={alert.direction === 'above' ? 'arrow-up' : 'arrow-down'}
                  size={11}
                  color="#6b7280"
                />
                <ThemedText variant="caption" color="muted">
                  {alert.direction === 'above' ? t('alerts.above') : t('alerts.below')}{' '}
                  {formatAlertRate({ rate: alert.targetRate, decimals, locale: i18n.language })}
                </ThemedText>
              </>
            ) : (
              <>
                <Ionicons name="swap-vertical" size={11} color="#6b7280" />
                <ThemedText variant="caption" color="muted">
                  {t('alerts.variationLabel', {
                    percent: alert.variationPercent,
                    rate: formatAlertRate({
                      rate: alert.baselineRate,
                      decimals,
                      locale: i18n.language,
                    }),
                  })}
                </ThemedText>
              </>
            )}
          </View>
        </View>

        {!hideStatusBadge && (
          <View className="mx-3 items-center">
            <View
              className={`rounded-full px-2 py-0.5 ${
                alert.isActive
                  ? 'bg-emerald-100 dark:bg-emerald-900/30'
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}>
              <ThemedText
                variant="caption"
                weight="semibold"
                color="inherit"
                className={
                  alert.isActive
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-gray-500 dark:text-gray-400'
                }>
                {alert.isActive ? t('alerts.active') : t('alerts.triggered')}
              </ThemedText>
            </View>
          </View>
        )}

        <View className="flex-row items-center gap-2">
          {canEdit && (
            <Pressable
              onPress={onEdit}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              className="h-9 w-9 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/20"
              accessibilityRole="button"
              accessibilityLabel={t('alerts.edit')}>
              <Ionicons name="create-outline" size={15} color={ALERT_THEME.primaryDark} />
            </Pressable>
          )}

          <Pressable
            onPress={onDelete}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="h-9 w-9 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20"
            accessibilityRole="button"
            accessibilityLabel={t('alerts.delete')}>
            <Ionicons name="trash-outline" size={15} color="#ef4444" />
          </Pressable>
        </View>
      </View>

      {proximity && tierStyle && (
        <View
          className={`mt-2 flex-row items-center gap-1.5 self-start rounded-md px-2 py-0.5 ${tierStyle.bg}`}>
          <View className={`h-1.5 w-1.5 rounded-full ${tierStyle.dot}`} />
          <ThemedText variant="caption" weight="medium" color="inherit" className={tierStyle.text}>
            {proximityLabel}
          </ThemedText>
        </View>
      )}
    </View>
  )
}
