import { ThemedText } from '@/components/ui/ThemedText'
import type { Statistics } from '@/types'
import { formatRateLocalized } from '@/utils/formatters'
import Ionicons from '@expo/vector-icons/Ionicons'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

interface StatisticsCardProps {
  statistics: Statistics
  decimals?: number
}

export function StatisticsCard({ statistics, decimals = 4 }: StatisticsCardProps) {
  const { t, i18n } = useTranslation()

  const formatNumber = (value: number): string =>
    formatRateLocalized({ rate: value, decimals, locale: i18n.language })

  const formatPercentage = (value: number): string =>
    `${value >= 0 ? '+' : ''}${formatRateLocalized({ rate: value, decimals: 2, locale: i18n.language })}%`

  const variationColor = statistics.variation >= 0 ? 'text-green-600' : 'text-red-600'
  const variationBgColor = statistics.variation >= 0 ? 'bg-green-50' : 'bg-red-50'
  const variationBgColorDark =
    statistics.variation >= 0 ? 'dark:bg-green-900/20' : 'dark:bg-red-900/20'

  return (
    <View className="mt-3 rounded-2xl bg-white p-4 dark:bg-gray-800">
      <ThemedText variant="subheading" className="mb-3">
        {t('statistics.subtitle')}
      </ThemedText>

      <View className="flex-row flex-wrap gap-3">
        <View className="min-w-[45%] flex-1 rounded-xl bg-gray-50 p-3 shadow-sm dark:bg-gray-700/50 dark:shadow-none">
          <ThemedText variant="caption" color="muted" className="mb-1">
            {t('common.currentRate')}
          </ThemedText>
          <ThemedText variant="heading">{formatNumber(statistics.currentRate)}</ThemedText>
        </View>

        <View
          className={`min-w-[45%] flex-1 rounded-xl p-3 shadow-sm ${variationBgColor} ${variationBgColorDark} dark:shadow-none`}>
          <View className="mb-1 flex-row items-center gap-1">
            <ThemedText variant="caption" color="muted">
              {t('common.variation')}
            </ThemedText>
            <Ionicons
              name={statistics.variation >= 0 ? 'trending-up' : 'trending-down'}
              size={14}
              color={statistics.variation >= 0 ? '#16a34a' : '#dc2626'}
            />
          </View>
          <ThemedText variant="heading" color="inherit" className={variationColor}>
            {formatPercentage(statistics.variation)}
          </ThemedText>
        </View>

        <View className="min-w-[45%] flex-1 rounded-xl bg-gray-50 p-3 shadow-sm dark:bg-gray-700/50 dark:shadow-none">
          <ThemedText variant="caption" color="muted" className="mb-1">
            {t('statistics.min')}
          </ThemedText>
          <ThemedText variant="subheading">{formatNumber(statistics.min)}</ThemedText>
        </View>

        <View className="min-w-[45%] flex-1 rounded-xl bg-gray-50 p-3 shadow-sm dark:bg-gray-700/50 dark:shadow-none">
          <ThemedText variant="caption" color="muted" className="mb-1">
            {t('statistics.max')}
          </ThemedText>
          <ThemedText variant="subheading">{formatNumber(statistics.max)}</ThemedText>
        </View>

        <View className="min-w-[45%] flex-1 rounded-xl bg-gray-50 p-3 shadow-sm dark:bg-gray-700/50 dark:shadow-none">
          <ThemedText variant="caption" color="muted" className="mb-1">
            {t('common.average')}
          </ThemedText>
          <ThemedText variant="subheading">{formatNumber(statistics.average)}</ThemedText>
        </View>
      </View>
    </View>
  )
}
