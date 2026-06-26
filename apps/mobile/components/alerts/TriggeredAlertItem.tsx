import { ThemedText } from '@/components/ui/ThemedText'
import { getCurrencyByCode } from '@/constants/currencies'
import { useSettingsStore } from '@/stores/settingsStore'
import type { Language, RateAlert } from '@/types'
import { isThresholdAlert, isVariationAlert } from '@/types'
import { getDateFnsLocale } from '@/utils/date'
import { formatAlertRate } from '@/utils/formatters'
import Ionicons from '@expo/vector-icons/Ionicons'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

type Props = {
  alert: RateAlert
  onRecreate: () => void
  onDelete: () => void
}

export function TriggeredAlertItem({ alert, onRecreate, onDelete }: Props) {
  const { t, i18n } = useTranslation()
  const language = useSettingsStore((s) => s.settings.language)
  const decimals = useSettingsStore((s) => s.settings.decimals)
  const from = getCurrencyByCode(alert.fromCurrency)
  const to = getCurrencyByCode(alert.toCurrency)

  const triggeredLabel = useMemo(() => {
    if (!alert.triggeredAt) return null
    try {
      return formatDistanceToNow(parseISO(alert.triggeredAt), {
        addSuffix: true,
        locale: getDateFnsLocale(language as Language),
      })
    } catch {
      return null
    }
  }, [alert.triggeredAt, language])

  return (
    <View className="mb-2 rounded-xl bg-white p-2 dark:bg-gray-800">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <ThemedText variant="label" weight="semibold">
            {from.flag} {alert.fromCurrency} / {to.flag} {alert.toCurrency}
          </ThemedText>
          <View className="mt-0.5 flex-row items-center gap-1">
            {isThresholdAlert(alert) && (
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
            )}
            {isVariationAlert(alert) && (
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

        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={onRecreate}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="h-9 w-9 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/30"
            accessibilityRole="button"
            accessibilityLabel={t('alerts.recreate')}>
            <Ionicons name="refresh" size={15} color="#d97706" />
          </Pressable>
          <Pressable
            onPress={onDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="h-9 w-9 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20"
            accessibilityRole="button"
            accessibilityLabel={t('alerts.delete')}>
            <Ionicons name="trash-outline" size={15} color="#ef4444" />
          </Pressable>
        </View>
      </View>

      <View className="mt-2 flex-row items-center gap-2 self-start rounded-md bg-emerald-50 px-1 py-0.5 dark:bg-emerald-900/20">
        <Ionicons name="checkmark-circle" size={11} color="#059669" />
        <ThemedText
          variant="caption"
          weight="medium"
          color="inherit"
          className="text-emerald-700 dark:text-emerald-400">
          {alert.triggeredAtRate != null
            ? t('alerts.triggeredAtRate', {
                rate: formatAlertRate({
                  rate: alert.triggeredAtRate,
                  decimals,
                  locale: i18n.language,
                }),
              })
            : t('alerts.triggered')}
        </ThemedText>
        {triggeredLabel && (
          <ThemedText variant="caption" color="muted" className="ml-1">
            · {triggeredLabel}
          </ThemedText>
        )}
      </View>
    </View>
  )
}
