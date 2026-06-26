import { useTranslation } from 'react-i18next'
import { Modal, Pressable, View } from 'react-native'

import Ionicons from '@expo/vector-icons/Ionicons'

import { ThemedText } from '@/components/ui/ThemedText'

type Props = {
  visible: boolean
  onDismiss: () => void
  onCtaTap: () => void
}

export function WidgetTooltipSheet({ visible, onDismiss, onCtaTap }: Props) {
  const { t } = useTranslation()

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onDismiss}>
      <Pressable
        className="flex-1 justify-end bg-black/40"
        onPress={onDismiss}
        accessibilityRole="button">
        <Pressable
          className="rounded-t-3xl bg-gray-50 px-6 pb-8 pt-6 dark:bg-gray-900"
          onPress={() => undefined}>
          <View className="mb-4 h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
            <Ionicons name="phone-portrait-outline" size={24} color="#f59e0b" />
          </View>

          <ThemedText variant="title" weight="bold" className="mb-2">
            {t('widget.tooltip.title')}
          </ThemedText>
          <ThemedText variant="body" color="muted" className="mb-6">
            {t('widget.tooltip.body')}
          </ThemedText>

          <Pressable
            onPress={onCtaTap}
            className="mb-2 items-center rounded-2xl bg-amber-400 p-4"
            accessibilityRole="button">
            <ThemedText variant="body" weight="bold" color="inherit" className="text-stone-900">
              {t('widget.tooltip.cta')}
            </ThemedText>
          </Pressable>

          <Pressable onPress={onDismiss} className="items-center p-3" accessibilityRole="button">
            <ThemedText variant="body" color="muted">
              {t('widget.tooltip.dismiss')}
            </ThemedText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
