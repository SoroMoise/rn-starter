import { Language } from '@/types'
import { getDateFnsLocale } from '@/utils'
import { formatDistanceToNow } from 'date-fns'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { ThemedText } from '@/components/ui/ThemedText'

interface LastUpdateBadgeProps {
  lastUpdate: Date | null
}

export function LastUpdateBadge({ lastUpdate }: LastUpdateBadgeProps) {
  const { t, i18n } = useTranslation()
  const [, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => prev + 1)
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  if (!lastUpdate) {
    return null
  }

  const timeAgo = formatDistanceToNow(lastUpdate, {
    addSuffix: true,
    locale: getDateFnsLocale(i18n.language as Language),
  })

  return (
    <View className="rounded-full bg-gray-100 px-4 py-2 dark:bg-gray-800">
      <ThemedText variant="caption" color="muted">
        {t('conversion.lastUpdate')}: {timeAgo}
      </ThemedText>
    </View>
  )
}
