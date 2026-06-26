import { ThemedText } from '@/components/ui/ThemedText'
import { ALERT_THEME } from '@/constants/alertTheme'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTranslation } from 'react-i18next'
import { Pressable } from 'react-native'

export function SheetBackButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="mx-6 mb-2 flex-row items-center gap-2">
      <Ionicons name="chevron-back" size={16} color={ALERT_THEME.primary} />
      <ThemedText variant="label" color="inherit" className="text-amber-600 dark:text-amber-400">
        {t('common.back')}
      </ThemedText>
    </Pressable>
  )
}
