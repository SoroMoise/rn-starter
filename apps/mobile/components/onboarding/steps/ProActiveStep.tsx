import Ionicons from '@expo/vector-icons/Ionicons'
import { useThemedColor } from '@hooks/useThemedColor'
import { LinearGradient } from 'expo-linear-gradient'
import { useTranslation } from 'react-i18next'
import { Platform, ScrollView, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { GradientButton } from '@/components/ui/GradientButton'
import { ThemedText } from '@/components/ui/ThemedText'

type Props = {
  onFinish: () => void
}

const BASE_BENEFITS = ['noAds', 'rateAlerts', 'export'] as const

export function ProActiveStep({ onFinish }: Props) {
  const { t } = useTranslation()
  const isDark = useThemedColor()
  const insets = useSafeAreaInsets()
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()

  const benefits = Platform.OS === 'android' ? [...BASE_BENEFITS, 'homeWidget'] : BASE_BENEFITS

  return (
    <View style={{ width: screenWidth, height: screenHeight }} className="flex-1">
      <LinearGradient
        colors={isDark ? ['#0f0c29', '#302b63', '#24243e'] : ['#f8faff', '#eef2ff', '#f5f3ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 90,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 24,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}>
        <View className="flex-1 justify-center">
          <View className="mb-5 h-16 w-16 items-center justify-center self-center rounded-3xl bg-violet-500/20">
            <Ionicons name="star" size={32} color="#8b5cf6" />
          </View>
          <ThemedText variant="display" align="center" className="text-3xl">
            {t('onboarding.proActive.title')}
          </ThemedText>
          <ThemedText variant="body" color="muted" align="center" className="mt-3">
            {t('onboarding.proActive.subtitle')}
          </ThemedText>

          <View className="mt-8 gap-3 self-center">
            {benefits.map((key) => (
              <View key={key} className="flex-row items-center gap-3">
                <Ionicons name="checkmark-circle" size={22} color="#34d399" />
                <ThemedText variant="body" weight="medium">
                  {t(`onboarding.pitch.secondary.${key}`)}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        <GradientButton
          onPress={onFinish}
          colors={['#3b82f6', '#6366f1', '#8b5cf6']}
          style={{ height: 58, borderRadius: 16, marginTop: 24 }}
          gradientStyle={{ height: '100%' }}
          accessibilityLabel={t('onboarding.proActive.cta')}>
          <ThemedText variant="buttonLarge" color="inverse">
            {t('onboarding.proActive.cta')}
          </ThemedText>
        </GradientButton>
      </ScrollView>
    </View>
  )
}
