import { AlertsBottomSheet } from '@/components/alerts/AlertsBottomSheet'
import { AllAlertsBottomSheet } from '@/components/alerts/AllAlertsBottomSheet'
import { ALERT_THEME } from '@/constants/alertTheme'
import { usePremium } from '@/hooks/usePremium'
import { useAlertsStore } from '@/stores/alertsStore'
import { triggerLight } from '@/utils/haptics'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, Text, View } from 'react-native'

type Props = {
  fromCurrency: string
  toCurrency: string
}

export function AlertsBell({ fromCurrency, toCurrency }: Props) {
  const { t } = useTranslation()
  const [sheetVisible, setSheetVisible] = useState(false)
  const [allVisible, setAllVisible] = useState(false)
  const { isPremium, openPaywall } = usePremium()

  const activeCount = useAlertsStore(
    (s) =>
      s.alerts.filter(
        (a) => a.isActive && a.fromCurrency === fromCurrency && a.toCurrency === toCurrency
      ).length
  )

  const handlePress = () => {
    triggerLight()
    setSheetVisible(true)
  }

  const handleUnlock = () => {
    setSheetVisible(false)
    setAllVisible(false)
    void openPaywall({ source: 'alerts_bell' })
  }

  return (
    <>
      <Pressable
        onPress={handlePress}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t('a11y.rateAlerts')}
        className="relative h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <Ionicons
          name={activeCount > 0 ? 'notifications' : 'notifications-outline'}
          size={18}
          color={activeCount > 0 ? ALERT_THEME.primary : ALERT_THEME.iconInactive}
        />
        {activeCount > 0 && (
          <View className="absolute -right-1 -top-1 h-4 w-4 items-center justify-center rounded-full bg-red-500">
            <Text className="text-[9px] font-semibold leading-3 text-white">
              {activeCount > 9 ? '9+' : activeCount}
            </Text>
          </View>
        )}
      </Pressable>

      <AlertsBottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        fromCurrency={fromCurrency}
        toCurrency={toCurrency}
        isPreview={!isPremium}
        onUnlockPress={handleUnlock}
        onSeeAllPress={() => setAllVisible(true)}
      />

      <AllAlertsBottomSheet
        visible={allVisible}
        onClose={() => setAllVisible(false)}
        isPreview={!isPremium}
        onUnlockPress={handleUnlock}
      />
    </>
  )
}
