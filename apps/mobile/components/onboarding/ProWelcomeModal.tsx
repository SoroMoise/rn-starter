import Ionicons from '@expo/vector-icons/Ionicons'
import { useThemedColor } from '@hooks/useThemedColor'
import { useTranslation } from 'react-i18next'
import { Modal, Pressable, View } from 'react-native'

import { GradientButton } from '@/components/ui/GradientButton'
import { ThemedText } from '@/components/ui/ThemedText'

type Props = {
  visible: boolean
  onSkip: () => void
  onContinue: () => void
}

export function ProWelcomeModal({ visible, onSkip, onContinue }: Props) {
  const { t } = useTranslation()
  const isDark = useThemedColor()

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onContinue}>
      <View className="flex-1 items-center justify-center bg-black/60 px-6">
        <View className={`w-full max-w-md rounded-3xl p-6 ${isDark ? 'bg-[#1a1a2e]' : 'bg-white'}`}>
          <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/20">
            <Ionicons name="star" size={28} color="#8b5cf6" />
          </View>

          <ThemedText variant="title" weight="bold" className="mb-2">
            {t('onboarding.proWelcome.title')}
          </ThemedText>
          <ThemedText variant="body" color="muted" className="mb-6">
            {t('onboarding.proWelcome.body')}
          </ThemedText>

          <GradientButton
            onPress={onSkip}
            colors={['#3b82f6', '#6366f1', '#8b5cf6']}
            style={{ height: 56, borderRadius: 14 }}
            gradientStyle={{ height: '100%' }}
            accessibilityLabel={t('onboarding.proWelcome.ctaSkip')}>
            <ThemedText variant="buttonLarge" color="inverse">
              {t('onboarding.proWelcome.ctaSkip')}
            </ThemedText>
          </GradientButton>

          <Pressable
            onPress={onContinue}
            className="mt-2 items-center p-3"
            accessibilityRole="button">
            <ThemedText variant="body" color="muted">
              {t('onboarding.proWelcome.ctaContinue')}
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}
