import { OfflineBanner } from '@/components/ui/OfflineBanner'
import { ThemedText } from '@/components/ui/ThemedText'
import { useThemedColor } from '@/hooks/useThemedColor'
import { useCurrencyStore } from '@/stores/currencyStore'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import type { Language } from '@/types'
import { formatRelativeTime } from '@/utils/time'
import Ionicons from '@expo/vector-icons/Ionicons'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

export const ConversionStatusBanners = React.memo(function ConversionStatusBanners() {
  const { t } = useTranslation()
  const { isOnline } = useNetworkStatus()
  const isDark = useThemedColor()
  const rates = useCurrencyStore((s) => s.rates)
  const lastUpdate = useCurrencyStore((s) => s.lastUpdate)
  const isDataStale = useCurrencyStore((s) => s.isDataStale())

  return (
    <>
      {!isOnline && <OfflineBanner timestamp={lastUpdate} />}

      {isOnline && isDataStale && rates && (
        <View className="mb-4 rounded-lg bg-yellow-100 px-4 py-3 dark:bg-yellow-900/30">
          <View className="flex-row items-center gap-2">
            <Ionicons name="warning" size={16} color={isDark ? '#fde047' : '#a16207'} />
            <ThemedText
              variant="label"
              color="inherit"
              className="text-yellow-800 dark:text-yellow-300">
              {t('conversion.dataOutdated')}
            </ThemedText>
          </View>
          {lastUpdate && <LastUpdateSubtext lastUpdate={lastUpdate} />}
        </View>
      )}
    </>
  )
})

function LastUpdateSubtext({ lastUpdate }: { lastUpdate: Date }) {
  const { t, i18n } = useTranslation()
  return (
    <ThemedText
      variant="caption"
      color="inherit"
      className="mt-1 text-yellow-700 dark:text-yellow-400">
      {t('conversion.lastUpdate')}: {formatRelativeTime(lastUpdate, i18n.language as Language)}
    </ThemedText>
  )
}
