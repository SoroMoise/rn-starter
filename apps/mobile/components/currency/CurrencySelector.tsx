import type { Currency, Language } from '@/types'
import { getCurrencyName } from '@utils/currency'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity, View } from 'react-native'
import { ThemedText } from '@/components/ui/ThemedText'

interface CurrencySelectorProps {
  currency: Currency
  onPress: () => void
  label?: string
}

export function CurrencySelector({ currency, onPress, label }: CurrencySelectorProps) {
  const { i18n } = useTranslation()

  return (
    <View className="w-full">
      {label && (
        <ThemedText
          variant="label"
          color="inherit"
          className="mb-2 text-gray-700 dark:text-gray-300">
          {label}
        </ThemedText>
      )}

      <TouchableOpacity
        onPress={onPress}
        className="flex-row items-center justify-between rounded-2xl border-2 border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800"
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${label || ''} ${currency.code}`}>
        <View className="flex-row items-center gap-3">
          <ThemedText color="inherit" className="text-3xl">
            {currency.flag}
          </ThemedText>

          <View>
            <ThemedText variant="heading">{currency.code}</ThemedText>
            <ThemedText variant="label" color="muted" weight="normal">
              {getCurrencyName(currency, i18n.language as Language)}
            </ThemedText>
          </View>
        </View>

        <ThemedText color="subtle" className="text-2xl">
          ›
        </ThemedText>
      </TouchableOpacity>
    </View>
  )
}
