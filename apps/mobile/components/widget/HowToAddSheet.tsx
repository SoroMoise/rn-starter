import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { ModalBottomSheet } from '@/components/ui/ModalBottomSheet'
import { ThemedText } from '@/components/ui/ThemedText'

export function HowToAddSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const steps = [
    t('settings.widget.howToSheet.step1'),
    t('settings.widget.howToSheet.step2'),
    t('settings.widget.howToSheet.step3'),
    t('settings.widget.howToSheet.step4'),
  ]

  return (
    <ModalBottomSheet
      visible={visible}
      onClose={onClose}
      title={t('settings.widget.howToSheet.title')}
      compact>
      <View className="px-6 pb-8 pt-2">
        {steps.map((step, idx) => (
          <View key={idx} className="mb-3 flex-row items-start">
            <View className="mr-3 mt-0.5 h-7 w-7 items-center justify-center rounded-full bg-amber-400">
              <ThemedText variant="label" weight="bold" color="inherit" className="text-stone-900">
                {idx + 1}
              </ThemedText>
            </View>
            <ThemedText variant="body" className="flex-1">
              {step}
            </ThemedText>
          </View>
        ))}
      </View>
    </ModalBottomSheet>
  )
}
