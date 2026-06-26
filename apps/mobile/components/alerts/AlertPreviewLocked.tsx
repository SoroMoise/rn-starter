import { GradientButton } from '@/components/ui/GradientButton'
import { ThemedText } from '@/components/ui/ThemedText'
import { ALERT_THEME } from '@/constants/alertTheme'
import { triggerLight } from '@/utils/haptics'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

export function AlertPreviewLocked({ onUnlockPress }: { onUnlockPress?: () => void }) {
  const { t } = useTranslation()
  return (
    <View className="items-center px-2 py-8">
      <View className="mb-5 h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-900/30">
        <Ionicons name="notifications" size={32} color={ALERT_THEME.primary} />
      </View>
      <ThemedText variant="heading" weight="bold" align="center" className="mb-3">
        {t('alerts.previewLockedTitle')}
      </ThemedText>
      <ThemedText variant="body" color="muted" align="center" className="mb-8 leading-relaxed">
        {t('alerts.previewLockedDescription')}
      </ThemedText>
      <GradientButton
        onPress={() => {
          triggerLight()
          onUnlockPress?.()
        }}
        colors={ALERT_THEME.unlockGradient}
        style={{ width: '100%', borderRadius: 14 }}>
        <Ionicons name="lock-open" size={16} color="white" />
        <ThemedText variant="button" color="inverse">
          {t('alerts.unlockWithPro')}
        </ThemedText>
      </GradientButton>
    </View>
  )
}
