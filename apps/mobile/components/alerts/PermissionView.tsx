import { GradientButton } from '@/components/ui/GradientButton'
import { ThemedText } from '@/components/ui/ThemedText'
import { ALERT_THEME } from '@/constants/alertTheme'
import { notificationService } from '@/services/notifications'
import { triggerLight, triggerSuccess, triggerWarning } from '@/utils/haptics'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

type Props = {
  fromCurrency: string
  toCurrency: string
  onGranted: () => void
  onSkipped: () => void
  onDenied: () => void
}

export function PermissionView({
  fromCurrency,
  toCurrency,
  onGranted,
  onSkipped,
  onDenied,
}: Props) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)

  const handleActivate = async () => {
    triggerLight()
    setIsLoading(true)
    const granted = await notificationService.requestPermission()
    setIsLoading(false)
    if (granted) {
      triggerSuccess()
      onGranted()
    } else {
      triggerWarning()
      onDenied()
    }
  }

  return (
    <View className="flex-1 items-center justify-center px-6 py-8">
      <View className="mb-5 h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-900/30">
        <Ionicons name="notifications-outline" size={32} color={ALERT_THEME.primary} />
      </View>

      <ThemedText variant="heading" weight="bold" align="center" className="mb-3">
        {t('alerts.permissionTitle')}
      </ThemedText>

      <ThemedText variant="body" color="muted" align="center" className="mb-8 leading-relaxed">
        {t('alerts.permissionDescription', { pair: `${fromCurrency}/${toCurrency}` })}
      </ThemedText>

      <GradientButton
        onPress={() => void handleActivate()}
        colors={ALERT_THEME.gradient}
        isLoading={isLoading}
        style={{ width: '100%', borderRadius: 14, marginBottom: 12 }}>
        <ThemedText variant="button" color="inverse">
          {t('alerts.permissionCTA')}
        </ThemedText>
      </GradientButton>

      <Pressable onPress={onSkipped} className="py-2">
        <ThemedText variant="label" color="muted">
          {t('alerts.permissionSkip')}
        </ThemedText>
      </Pressable>
    </View>
  )
}
