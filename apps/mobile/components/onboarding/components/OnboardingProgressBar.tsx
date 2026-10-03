import { useThemedColor } from '@hooks/useThemedColor'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import Animated from 'react-native-reanimated'

interface OnboardingProgressBarProps {
  totalSteps: number
  currentStep: number
}

export function OnboardingProgressBar({ totalSteps, currentStep }: OnboardingProgressBarProps) {
  const { t } = useTranslation()
  const isDark = useThemedColor()
  return (
    <View
      className="flex-row gap-2"
      accessible
      accessibilityLabel={t('onboarding.a11y.step', {
        current: currentStep + 1,
        total: totalSteps,
      })}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          className={`h-1 flex-1 overflow-hidden rounded-full ${
            isDark ? 'bg-white/10' : 'bg-black/10'
          }`}>
          <Animated.View
            className={`h-full rounded-full ${
              index <= currentStep ? 'bg-accent-400' : 'bg-transparent'
            }`}
            style={{ width: index <= currentStep ? '100%' : '0%' }}
          />
        </View>
      ))}
    </View>
  )
}
