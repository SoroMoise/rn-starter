import { ThemedText } from '@/components/ui/ThemedText'
import i18n from '@/i18n/service'
import { useCurrencyStore } from '@/stores/currencyStore'
import { useSettingsStore } from '@/stores/settingsStore'
import type { Currency, Language } from '@/types'
import { getDateFnsLocale } from '@/utils'
import { getCurrencyName } from '@/utils/currency'
import { formatRawNumberForDisplay, getDecimalSeparator } from '@/utils/formatters'
import { triggerLight } from '@/utils/haptics'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useNetworkStatus } from '@hooks/useNetworkStatus'
import { useThemedColor } from '@hooks/useThemedColor'
import { formatDistanceToNow } from 'date-fns'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, TouchableOpacity, View } from 'react-native'

interface SourceCardProps {
  currency: Currency
  amount: string
  onCurrencyPress: () => void
  onAmountPress: () => void
}

export const SourceCard = React.memo(function SourceCard({
  currency,
  amount,
  onCurrencyPress,
  onAmountPress,
}: SourceCardProps) {
  const { t } = useTranslation()
  const lastUpdate = useCurrencyStore((s) => s.lastUpdate)
  const isDataStale = useCurrencyStore((s) => s.isDataStale())
  const { isOnline } = useNetworkStatus()
  const isDark = useThemedColor()
  const thousandSeparator = useSettingsStore((s) => s.settings.thousandSeparator)
  const showInlineLastUpdate = isOnline && !isDataStale

  const locale = i18n.language
  const rawAmount = amount && amount !== '0' ? amount : '0'
  const formattedAmount = formatRawNumberForDisplay(rawAmount, {
    locale,
    useSeparator: thousandSeparator,
  })

  const decimalSep = getDecimalSeparator(locale)
  const sepIndex = formattedAmount.indexOf(decimalSep)
  const integerPart = sepIndex >= 0 ? formattedAmount.slice(0, sepIndex) : formattedAmount
  const decimalPart = sepIndex >= 0 ? formattedAmount.slice(sepIndex) : ''

  const handleAmountPress = React.useCallback(() => {
    triggerLight()
    onAmountPress()
  }, [onAmountPress])

  return (
    <View
      className="mb-3 overflow-hidden rounded-2xl border border-indigo-500/20 dark:border-indigo-400/20"
      style={{
        backgroundColor: isDark ? '#252547' : '#f0f0ff',
      }}>
      <TouchableOpacity
        onPress={onCurrencyPress}
        activeOpacity={0.7}
        className="flex-row items-center gap-3 px-5 pb-2 pt-5"
        accessibilityRole="button"
        accessibilityLabel={`${t('conversion.selectCurrency')}: ${currency.code}`}>
        <ThemedText color="inherit" className="text-3xl">
          {currency.flag}
        </ThemedText>
        <View className="flex-1">
          <ThemedText variant="heading">{currency.code}</ThemedText>
          <ThemedText variant="caption" color="muted">
            {getCurrencyName(currency, i18n.language as Language)}
          </ThemedText>
        </View>
        <Ionicons name="chevron-down" size={18} color={isDark ? '#9ca3af' : '#6b7280'} />
      </TouchableOpacity>

      <Pressable
        onPress={handleAmountPress}
        className="px-5 py-3"
        accessibilityRole="button"
        accessibilityLabel={`${t('conversion.amount')}: ${formattedAmount}`}
        accessibilityHint={t('conversion.enterAmount')}>
        <ThemedText
          weight="extrabold"
          style={{ fontSize: 40, lineHeight: 48 }}
          numberOfLines={1}
          adjustsFontSizeToFit>
          {integerPart}
          {decimalPart ? (
            <ThemedText color="subtle" style={{ fontSize: 26 }}>
              {decimalPart}
            </ThemedText>
          ) : null}
        </ThemedText>
      </Pressable>

      <View className="flex-row items-center px-5 pb-4">
        <View className="mr-3 flex-1">
          {lastUpdate && showInlineLastUpdate ? (
            <ThemedText variant="caption" color="subtle" numberOfLines={2}>
              {t('conversion.lastUpdate')}:{' '}
              {formatDistanceToNow(lastUpdate, {
                addSuffix: true,
                locale: getDateFnsLocale(i18n.language as Language),
              })}
            </ThemedText>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={handleAmountPress}
          className="flex-row items-center gap-1.5 rounded-lg px-3 py-1.5"
          style={{ backgroundColor: isDark ? '#3a3a6a' : '#ddd8ff', flexShrink: 0 }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('conversion.enterAmount')}>
          <Ionicons name="calculator-outline" size={14} color={isDark ? '#a5b4fc' : '#6366f1'} />
          <ThemedText
            variant="caption"
            weight="semibold"
            color="inherit"
            style={{ color: isDark ? '#a5b4fc' : '#6366f1' }}>
            {t('conversion.calc')}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  )
})
