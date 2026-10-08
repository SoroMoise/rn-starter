import { DirectionalIcon } from '@/components/ui/DirectionalIcon'
import { triggerLight } from '@/utils/haptics'
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
        className="h-[58px] w-[58px] items-center justify-center overflow-hidden rounded-2xl bg-black/5 dark:bg-white/10"
        accessibilityRole="button"
        accessibilityLabel={t('onboarding.previous')}>
        <DirectionalIcon
          name="chevron-back"
          size={24}
          color={isDark ? 'white' : '#374151'}
          style={{ opacity: 0.7 }}
        />
      </Pressable>
    </Animated.View>
  )
}
