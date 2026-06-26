import { AlertListItem } from '@/components/alerts/AlertListItem'
import { ThemedText } from '@/components/ui/ThemedText'
import { getCurrencyByCode } from '@/constants/currencies'
import type { PairGroup } from '@/hooks/useAlertsHubData'
import { useCurrencyStore } from '@/stores/currencyStore'
import { useSettingsStore } from '@/stores/settingsStore'
import type { RateAlert } from '@/types'
import { calculateCrossRate } from '@/utils/crossRate'
import { formatAlertRate } from '@/utils/formatters'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

export function PairGroupBlock({
  group,
  onDelete,
  onEdit,
}: {
  group: PairGroup
  onDelete: (id: string) => void
  onEdit: (alert: RateAlert) => void
}) {
  const { t, i18n } = useTranslation()
  const from = getCurrencyByCode(group.from)
  const to = getCurrencyByCode(group.to)
  const rates = useCurrencyStore((s) => s.rates)
  const decimals = useSettingsStore((s) => s.settings.decimals)

  const currentRate = useMemo(() => {
    if (!rates) return null
    return calculateCrossRate({ rates: rates.rates, from: group.from, to: group.to })
  }, [rates, group.from, group.to])

  return (
    <View className="mb-5">
      <View className="mb-2 flex-row items-center gap-2 px-1">
        <ThemedText variant="label" weight="semibold">
          {from.flag} {group.from} → {to.flag} {group.to}
        </ThemedText>
        <View className="rounded-full bg-amber-100 px-2 py-0.5 dark:bg-amber-900/40">
          <ThemedText
            variant="caption"
            weight="bold"
            color="inherit"
            className="text-amber-700 dark:text-amber-300">
            {group.items.length}
          </ThemedText>
        </View>
        {currentRate != null && (
          <ThemedText variant="caption" weight="semibold" color="muted" className="ml-auto">
            {t('alerts.currentRate', {
              rate: formatAlertRate({ rate: currentRate, decimals, locale: i18n.language }),
            })}
          </ThemedText>
        )}
      </View>
      {group.items.map((alert) => (
        <AlertListItem
          key={alert.id}
          alert={alert}
          onDelete={() => onDelete(alert.id)}
          onEdit={() => onEdit(alert)}
          hideStatusBadge
        />
      ))}
    </View>
  )
}
