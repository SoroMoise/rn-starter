import { LanguagePill } from '@/components/onboarding/components/LanguagePill'
import { useOnboardingForward } from '@/components/onboarding/onboardingForward'
import { DirectionalIcon } from '@/components/ui/DirectionalIcon'
import { GradientButton } from '@/components/ui/GradientButton'
import { ThemedText } from '@/components/ui/ThemedText'
import { GRADIENTS } from '@/constants/uiColors'
import { useThemedColor } from '@hooks/useThemedColor'
import { LinearGradient } from 'expo-linear-gradient'
import { MotiView } from 'moti'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type WelcomeStepProps = {
  onStart: () => void
  onOpenLanguagePicker: () => void
}

export function WelcomeStep({ onStart, onOpenLanguagePicker }: WelcomeStepProps) {
  const { t } = useTranslation()
  const isDark = useThemedColor()
  const insets = useSafeAreaInsets()
  useOnboardingForward(onStart)

  return (
    <View className="flex-1">
      <LinearGradient
        colors={isDark ? GRADIENTS.onboardingStepDark : GRADIENTS.onboardingStepLight}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />

      <View className="absolute inset-0 items-center justify-center px-8">
        <MotiView
          from={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', delay: 70, damping: 15, stiffness: 80 }}>
          <View className="mb-6 h-28 w-28 items-center justify-center self-center rounded-[2rem] bg-accent-500/10 dark:bg-white/10">
            <ThemedText variant="inherit" color="inherit" className="py-4 text-6xl">
              ✦
            </ThemedText>
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 300, damping: 45 }}>
          <ThemedText variant="display" align="center" className="mb-2">
            {t('common.appName')}
          </ThemedText>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 500, damping: 45 }}>
          <ThemedText
            variant="heading"
            color="muted"
            weight="medium"
            align="center"
            className="leading-7">
            {t('onboarding.welcome.subtitle')}
          </ThemedText>
        </MotiView>
      </View>

      <View className="absolute left-6 z-10" style={{ top: insets.top + 44 }}>
        <LanguagePill onPress={onOpenLanguagePicker} />
      </View>

      <View className="absolute left-0 right-0 z-10 px-6" style={{ bottom: insets.bottom + 16 }}>
        <GradientButton
          onPress={onStart}
          colors={GRADIENTS.cta}
          style={{ height: 58, borderRadius: 16 }}
          gradientStyle={{ gap: 12 }}
          pressScale={0}
          pressOpacity={0.75}
          accessibilityLabel={t('onboarding.welcome.cta')}>
          <ThemedText variant="buttonLarge" color="inverse" align="center" className="shrink">
            {t('onboarding.welcome.cta')}
          </ThemedText>
          <DirectionalIcon name="arrow-forward" size={20} color="#ffffff" />
        </GradientButton>

        <ThemedText variant="caption" color="muted" align="center" className="mt-2">
          {t('onboarding.welcome.reassurance')}
        </ThemedText>
      </View>
    </View>
  )
}
