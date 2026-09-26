import { ThemedText } from '@/components/ui/ThemedText'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

export function ProBadge({ label }: { label?: string }) {
  const { t } = useTranslation()

  return (
    <View className="rounded-full bg-violet-100 px-2 py-0.5 dark:bg-violet-500/20">
      <ThemedText
        variant="caption"
        color="inherit"
        weight="semibold"
        className="text-violet-700 dark:text-violet-300">
        {label ?? t('premiumGate.proBadge')}
      </ThemedText>
    </View>
  )
}
