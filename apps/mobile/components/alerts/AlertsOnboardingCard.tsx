import { ThemedText } from '@/components/ui/ThemedText'
import { ALERT_THEME } from '@/constants/alertTheme'
import { triggerLight } from '@/utils/haptics'
import Ionicons from '@expo/vector-icons/Ionicons'
import type { ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'
import Animated, { Easing, FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated'

type IoniconName = ComponentProps<typeof Ionicons>['name']

interface Step {
  icon: IoniconName
  i18nKey: string
}

const STEPS: Step[] = [
  { icon: 'notifications-outline', i18nKey: 'alerts.onboardingStep1' },
  { icon: 'flash-outline', i18nKey: 'alerts.onboardingStep2' },
  { icon: 'archive-outline', i18nKey: 'alerts.onboardingStep3' },
]

interface Props {
  onDismiss: () => void
}

export function AlertsOnboardingCard({ onDismiss }: Props) {
  const { t } = useTranslation()

  const handleDismiss = () => {
    triggerLight()
    onDismiss()
  }

  return (
    <Animated.View
      layout={LinearTransition.duration(220).easing(Easing.inOut(Easing.cubic))}
      entering={FadeIn.duration(240)}
      exiting={FadeOut.duration(180)}
      className="mb-4 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-900/10">
      <View className="mb-3 flex-row items-center gap-2">
        <Ionicons name="sparkles" size={16} color={ALERT_THEME.primary} />
        <ThemedText
          variant="label"
          weight="bold"
          color="inherit"
          className="text-amber-700 dark:text-amber-300">
          {t('alerts.onboardingTitle')}
        </ThemedText>
      </View>

      <View className="mb-3 gap-2">
        {STEPS.map((step) => (
          <View key={step.i18nKey} className="flex-row items-start gap-2">
            <View className="mt-0.5 h-5 w-5 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
              <Ionicons name={step.icon} size={11} color={ALERT_THEME.primaryDark} />
            </View>
            <ThemedText
              variant="caption"
              color="inherit"
              className="flex-1 text-amber-900 dark:text-amber-100">
              {t(step.i18nKey)}
            </ThemedText>
          </View>
        ))}
      </View>

      <Pressable
        onPress={handleDismiss}
        accessibilityRole="button"
        className="self-end rounded-lg bg-amber-500 px-3 py-1.5">
        <ThemedText variant="caption" weight="semibold" color="inverse">
          {t('alerts.onboardingCta')}
        </ThemedText>
      </Pressable>
    </Animated.View>
  )
}
