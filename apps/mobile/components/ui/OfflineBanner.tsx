import { ThemedText } from '@/components/ui/ThemedText'
import { useThemedColor } from '@/hooks/useThemedColor'
import type { Language } from '@/types'
import { formatRelativeTime } from '@/utils/time'
import Ionicons from '@expo/vector-icons/Ionicons'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

export function OfflineBanner({ timestamp }: { timestamp: Date | number | null }) {
  const { t, i18n } = useTranslation()
  const isDark = useThemedColor()

  return (
    <View className="mb-4 rounded-lg bg-orange-100 px-4 py-3 dark:bg-orange-900/30">
      <View className="flex-row items-center gap-2">
        <Ionicons name="cloud-offline" size={16} color={isDark ? '#fdba74' : '#9a3412'} />
        <ThemedText
          variant="label"
          color="inherit"
          className="text-orange-800 dark:text-orange-300">
          {t('common.offline')}
        </ThemedText>
      </View>
      {timestamp != null && (
        <ThemedText
          variant="caption"
          color="inherit"
          className="mt-1 text-orange-700 dark:text-orange-400">
          {t('conversion.lastUpdate')}: {formatRelativeTime(timestamp, i18n.language as Language)}
        </ThemedText>
      )}
    </View>
  )
}
