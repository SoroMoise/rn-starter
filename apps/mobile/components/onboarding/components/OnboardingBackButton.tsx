import { triggerLight } from '@/utils/haptics'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useThemedColor } from '@hooks/useThemedColor'
import { useTranslation } from 'react-i18next'
import { Pressable } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'

interface OnboardingBackButtonProps {
  onPress: () => void
}

export function OnboardingBackButton({ onPress }: OnboardingBackButtonProps) {
  const { t } = useTranslation()
  const isDark = useThemedColor()

  const handlePress = () => {
    triggerLight()
    onPress()
  }

  return (
    <Animated.View entering={FadeIn.duration(200)}>
      <Pressable
        onPress={handlePress}
        className={`h-[58px] w-[58px] items-center justify-center overflow-hidden rounded-2xl ${
          isDark ? 'bg-white/10' : 'bg-black/5'
        }`}
        accessibilityRole="button"
        accessibilityLabel={t('onboarding.previous')}>
        <Ionicons
          name="chevron-back"
          size={24}
          color={isDark ? 'white' : '#374151'}
          style={{ opacity: 0.7 }}
        />
      </Pressable>
    </Animated.View>
  )
}
