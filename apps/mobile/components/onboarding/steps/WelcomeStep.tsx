import { ThemedText } from '@/components/ui/ThemedText'
import { useThemedColor } from '@hooks/useThemedColor'
import { LinearGradient } from 'expo-linear-gradient'
import { MotiView } from 'moti'
import { useTranslation } from 'react-i18next'
import { useWindowDimensions, View } from 'react-native'

export function WelcomeStep() {
  const { t } = useTranslation()
  const isDark = useThemedColor()
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()

  return (
    <View style={{ width: screenWidth, height: screenHeight }} className="flex-1">
      <LinearGradient
        colors={isDark ? ['#0f0c29', '#302b63', '#24243e'] : ['#f8faff', '#eef2ff', '#f5f3ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />

      <View className="absolute inset-0 items-center justify-center px-8">
        <MotiView
          from={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', delay: 70, damping: 15, stiffness: 80 }}>
          <View
            className={`mb-6 h-28 w-28 items-center justify-center self-center rounded-[32px] ${isDark ? 'bg-white/10' : 'bg-indigo-500/10'}`}>
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
    </View>
  )
}
