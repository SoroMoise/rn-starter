import { GradientButton } from '@/components/ui/GradientButton'
import { ThemedText } from '@/components/ui/ThemedText'
import { usePremium } from '@/hooks/usePremium'
import { triggerLight } from '@/utils/haptics'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useThemedColor } from '@hooks/useThemedColor'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, Pressable, ScrollView, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface PremiumValueStepProps {
  onTriggerSkip: () => void
}

const TIMELINE = [
  { dot: '#3b82f6', icon: 'lock-open' as const, key: 'day0' },
  { dot: '#f59e0b', icon: 'notifications' as const, key: 'day5' },
  { dot: '#6b7280', icon: 'card' as const, key: 'day7' },
]

const BASE_BENEFITS = ['noAds', 'notifications', 'premium'] as const
const ANDROID_BENEFITS = [...BASE_BENEFITS, 'widget'] as const

export function PremiumValueStep({ onTriggerSkip }: PremiumValueStepProps) {
  const { t } = useTranslation()
  const isDark = useThemedColor()
  const insets = useSafeAreaInsets()
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()
  const { purchaseAnnual, restorePurchases, isLoadingPurchase, annualPackage } = usePremium()

  const benefits = Platform.OS === 'android' ? ANDROID_BENEFITS : BASE_BENEFITS

  const handleStart = useCallback(() => {
    if (!annualPackage) return
    triggerLight()
    void purchaseAnnual()
  }, [annualPackage, purchaseAnnual])

  const handleRestore = useCallback(() => {
    triggerLight()
    void restorePurchases()
  }, [restorePurchases])

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
          paddingTop: insets.top + 88,
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 24,
        }}
        showsVerticalScrollIndicator={false}>
        <View className="mb-5 h-16 w-16 items-center justify-center self-center rounded-3xl bg-violet-500/20">
          <Ionicons name="star" size={32} color="#8b5cf6" />
        </View>

        <ThemedText variant="display" align="center" className="text-3xl">
          {t('onboarding.premium.headline')}
        </ThemedText>

        <View className="mt-6 gap-3">
          {benefits.map((key) => (
            <View key={key} className="flex-row items-center gap-3">
              <Ionicons name="checkmark-circle" size={22} color="#34d399" />
              <ThemedText variant="body" weight="medium">
                {t(`onboarding.premium.benefit.${key}`)}
              </ThemedText>
            </View>
          ))}
        </View>

        <View className={`mt-6 rounded-2xl p-4 ${isDark ? 'bg-white/5' : 'bg-indigo-500/[0.06]'}`}>
          <ThemedText variant="caption" color="muted" className="mb-3 uppercase">
            {t('onboarding.premium.timelineHeader')}
          </ThemedText>
          {TIMELINE.map((row, index) => (
            <View
              key={row.key}
              className={`flex-row items-center gap-3 ${index >= TIMELINE.length - 1 ? 'mb-0' : 'mb-2'}`}>
              <View
                className="h-6 w-6 items-center justify-center rounded-full"
                style={{ backgroundColor: row.dot }}>
                <Ionicons name={row.icon} size={12} color="#ffffff" />
              </View>
              <ThemedText variant="label" color="muted" className="flex-1">
                {t(`onboarding.premium.${row.key}`)}
              </ThemedText>
            </View>
          ))}
        </View>

        <GradientButton
          onPress={handleStart}
          isLoading={isLoadingPurchase}
          disabled={!annualPackage}
          colors={['#3b82f6', '#6366f1', '#8b5cf6']}
          style={{ height: 58, borderRadius: 16, marginTop: 20 }}
          gradientStyle={{ height: '100%' }}
          accessibilityLabel={t('onboarding.premium.ctaStart')}>
          <ThemedText variant="buttonLarge" color="inverse">
            {t('onboarding.premium.ctaStart')}
          </ThemedText>
          <Ionicons name="arrow-forward" size={20} color="#ffffff" />
        </GradientButton>

        <View className="mt-3 flex-row flex-wrap items-center justify-center">
          <Pressable
            onPress={onTriggerSkip}
            disabled={isLoadingPurchase}
            className="py-2"
            accessibilityRole="button">
            <ThemedText variant="body" weight="semibold" color="dimmed" className="underline">
              {t('onboarding.premium.ctaSkip')}
            </ThemedText>
          </Pressable>
          <ThemedText variant="body" color="subtle" weight="bold" className="px-2.5">
            ·
          </ThemedText>
          <Pressable
            onPress={handleRestore}
            disabled={isLoadingPurchase}
            className="py-2"
            accessibilityRole="button">
            <ThemedText variant="body" color="dimmed">
              {t('onboarding.premium.restore')}
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  )
}
