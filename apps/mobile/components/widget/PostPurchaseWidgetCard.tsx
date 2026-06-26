import Ionicons from '@expo/vector-icons/Ionicons'
import { useTranslation } from 'react-i18next'
import { Modal, Pressable, View } from 'react-native'

import { ThemedText } from '@/components/ui/ThemedText'

type Props = {
  visible: boolean
  onDismiss: () => void
  onCtaTap: () => void
}

export function PostPurchaseWidgetCard({ visible, onDismiss, onCtaTap }: Props) {
  const { t } = useTranslation()

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onDismiss}>
      <View className="flex-1 items-center justify-center bg-black/60 px-6">
        <View className="w-full max-w-md rounded-3xl bg-white p-6 dark:bg-gray-900">
          <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
            <Ionicons name="phone-portrait-outline" size={28} color="#f59e0b" />
          </View>

          <ThemedText variant="title" weight="bold" className="mb-2">
            {t('widget.postPurchaseCard.title')}
          </ThemedText>
          <ThemedText variant="body" color="muted" className="mb-6">
            {t('widget.postPurchaseCard.body')}
          </ThemedText>

          <Pressable
            onPress={onCtaTap}
            className="mb-2 items-center rounded-2xl bg-amber-400 p-4"
            accessibilityRole="button">
            <ThemedText variant="body" weight="bold" color="inherit" className="text-stone-900">
              {t('widget.postPurchaseCard.cta')}
            </ThemedText>
          </Pressable>

          <Pressable onPress={onDismiss} className="items-center p-3" accessibilityRole="button">
            <ThemedText variant="body" color="muted">
              {t('widget.postPurchaseCard.later')}
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}
