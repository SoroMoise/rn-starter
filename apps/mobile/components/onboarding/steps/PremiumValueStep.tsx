import { PaywallLegalLinks } from '@/components/paywall/PaywallLegalLinks'
import { PaywallPerks } from '@/components/paywall/PaywallPerks'
import { PaywallTrustRow } from '@/components/paywall/PaywallTrustRow'
import { PriceRetryNotice } from '@/components/paywall/PriceRetryNotice'
import { DirectionalIcon } from '@/components/ui/DirectionalIcon'
import { GradientButton } from '@/components/ui/GradientButton'
import { ThemedText } from '@/components/ui/ThemedText'
import { ONBOARDING_PREMIUM_ORIGIN } from '@/constants/purchases'
import { GRADIENTS } from '@/constants/uiColors'
import { usePaywallPlans } from '@/hooks/usePaywallPlans'
import { usePremium } from '@/hooks/usePremium'
import { triggerLight } from '@/utils/haptics'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useThemedColor } from '@hooks/useThemedColor'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface PremiumValueStepProps {
  onTriggerSkip: () => void
}

export function PremiumValueStep({ onTriggerSkip }: PremiumValueStepProps) {
  const { t } = useTranslation()
  const isDark = useThemedColor()
  const insets = useSafeAreaInsets()
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()
  const { isLoadingPrices } = usePremium()
  const { selectedPlan, ctaLabel, legalNote, isLoadingPurchase, purchaseSelected } =
    usePaywallPlans(ONBOARDING_PREMIUM_ORIGIN)

  // The frieze describes the trial the store actually reported, and only what happens on its
  // own: nothing in the app sends a reminder before the trial ends, so no row promises one.
  const trialDays = selectedPlan?.hasTrial ? (selectedPlan.trialDays ?? null) : null
  const timeline =
    trialDays === null
      ? []
      : [
          { dot: '#3b82f6', icon: 'lock-open' as const, key: 'dayUnlock', day: 0 },
          { dot: '#6b7280', icon: 'card' as const, key: 'dayBilling', day: trialDays },
        ]

  const handleStart = useCallback(() => {
    triggerLight()
    void purchaseSelected()
  }, [purchaseSelected])

  const offerPanelClass = `mt-6 rounded-2xl p-4 ${isDark ? 'bg-white/5' : 'bg-indigo-500/[0.06]'}`

  return (
    <View style={{ width: screenWidth, height: screenHeight }} className="flex-1">
      <LinearGradient
        colors={isDark ? GRADIENTS.onboardingStepDark : GRADIENTS.onboardingStepLight}
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

        <View className="mt-6">
          <PaywallPerks />
        </View>

        {timeline.length > 0 && (
          <View className={offerPanelClass}>
            <ThemedText variant="caption" color="muted" className="mb-3 uppercase">
              {t('onboarding.premium.timelineHeader')}
            </ThemedText>
            {timeline.map((row, index) => (
              <View
                key={row.key}
                className={`flex-row items-center gap-3 ${index >= timeline.length - 1 ? 'mb-0' : 'mb-2'}`}>
                <View
                  className="h-6 w-6 items-center justify-center rounded-full"
                  style={{ backgroundColor: row.dot }}>
                  <Ionicons name={row.icon} size={12} color="#ffffff" />
                </View>
                <ThemedText variant="label" color="muted" className="flex-1">
                  {t(`onboarding.premium.${row.key}`, { day: row.day })}
                </ThemedText>
              </View>
            ))}
          </View>
        )}

        {selectedPlan ? (
          <>
            <GradientButton
              onPress={handleStart}
              isLoading={isLoadingPurchase}
              colors={GRADIENTS.cta}
              style={{ height: 58, borderRadius: 16, marginTop: 20 }}
              gradientStyle={{ height: '100%', gap: 8 }}
              accessibilityLabel={ctaLabel}>
              <ThemedText variant="buttonLarge" color="inverse">
                {ctaLabel}
              </ThemedText>
              <DirectionalIcon name="arrow-forward" size={20} color="#ffffff" />
            </GradientButton>

            <View className="mt-4">
              <PaywallTrustRow plan={selectedPlan} />
            </View>

            {legalNote ? (
              <ThemedText variant="caption" color="muted" align="center" className="mt-3">
                {legalNote}
              </ThemedText>
            ) : null}
          </>
        ) : isLoadingPrices ? (
          <View className="mt-6">
            <PriceRetryNotice />
          </View>
        ) : (
          // With no plan loaded there is no price to state, so no button to press either: a
          // disabled CTA reads as broken, a sentence with a retry reads as a network problem.
          <View className={offerPanelClass}>
            <ThemedText variant="body" color="muted" align="center" className="mb-2">
              {t('paywall.offerUnavailable')}
            </ThemedText>
            <PriceRetryNotice />
          </View>
        )}

        <Pressable
          onPress={onTriggerSkip}
          disabled={isLoadingPurchase}
          className="mt-4 items-center py-2"
          accessibilityRole="button">
          <ThemedText variant="body" weight="semibold" color="dimmed" className="underline">
            {t('onboarding.premium.ctaSkip')}
          </ThemedText>
        </Pressable>

        <View className="mt-2">
          <PaywallLegalLinks origin={ONBOARDING_PREMIUM_ORIGIN} />
        </View>
      </ScrollView>
    </View>
  )
}
