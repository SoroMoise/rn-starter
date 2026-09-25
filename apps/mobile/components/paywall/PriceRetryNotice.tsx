import { ThemedText } from '@/components/ui/ThemedText'
import { usePremium } from '@/hooks/usePremium'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Pressable, View } from 'react-native'

/**
 * Says why there are no prices, and offers a way back. Without it a captive portal
 * leaves the sale looking broken with nothing the user can act on.
 */
export function PriceRetryNotice() {
  const { t } = useTranslation()
  const { hasPrices, isLoadingPrices, retryPrices } = usePremium()

  if (hasPrices) return null

  if (isLoadingPrices) {
    return (
      <View className="items-center py-1">
        <ActivityIndicator size="small" />
      </View>
    )
  }

  return (
    <Pressable
      onPress={() => void retryPrices()}
      accessibilityRole="button"
      className="flex-row items-center justify-center gap-1.5 py-1">
      <ThemedText variant="caption" color="muted">
        {t('paywall.pricesUnavailable')}
      </ThemedText>
      <ThemedText variant="caption" color="primary" className="underline">
        {t('paywall.pricesRetry')}
      </ThemedText>
    </Pressable>
  )
}
