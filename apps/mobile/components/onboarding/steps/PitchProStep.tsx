import { AlertNotificationMock } from '@/components/onboarding/PersonaVisualMock/AlertNotificationMock'
import { CleanAppMock } from '@/components/onboarding/PersonaVisualMock/CleanAppMock'
import { DocumentExportMock } from '@/components/onboarding/PersonaVisualMock/DocumentExportMock'
import { PhoneHomeScreenMock } from '@/components/onboarding/PersonaVisualMock/PhoneHomeScreenMock'
import { GradientButton } from '@/components/ui/GradientButton'
import { ThemedText } from '@/components/ui/ThemedText'
import { ALL_PERSONAS, PERSONA_CONTENT, type HeroVisualKind } from '@/constants/personaContent'
import { SOCIAL_PROOF } from '@/constants/socialProof'
import { usePremium } from '@/hooks/usePremium'
import type { Persona } from '@/stores/onboardingStore'
import { triggerLight } from '@/utils/haptics'
import { computeSavingsPercent } from '@/utils/pricing'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useThemedColor } from '@hooks/useThemedColor'
import { LinearGradient } from 'expo-linear-gradient'
import { Fragment, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface PitchProStepProps {
  persona: Persona | null
  onTriggerSkip: () => void
}

const TIMELINE = [
  { dot: '#3b82f6', icon: 'lock-open' as const, key: 'day0' },
  { dot: '#f59e0b', icon: 'notifications' as const, key: 'day5' },
  { dot: '#6b7280', icon: 'card' as const, key: 'day7' },
]

function TrustDot() {
  return (
    <ThemedText variant="caption" color="subtle" weight="bold">
      ·
    </ThemedText>
  )
}

function HeroVisual({ kind }: { kind: HeroVisualKind }) {
  switch (kind) {
    case 'widget-mockup':
      return <PhoneHomeScreenMock />
    case 'alert-mockup':
      return <AlertNotificationMock />
    case 'document-mockup':
      return <DocumentExportMock />
    case 'clean-app-mockup':
      return <CleanAppMock />
  }
}

function DevPersonaSwitcher({
  active,
  onSelect,
  top,
}: {
  active: Persona
  onSelect: (persona: Persona) => void
  top: number
}) {
  if (!__DEV__) return null
  return (
    <View
      pointerEvents="box-none"
      className="absolute left-0 right-0 z-40 flex-row justify-center"
      style={{ top }}>
      <View className="flex-row items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/15 px-1.5 py-1">
        <Text className="px-1 text-[9px] font-bold text-amber-500">DEV</Text>
        {ALL_PERSONAS.map((persona) => (
          <Pressable
            key={persona}
            onPress={() => {
              triggerLight()
              onSelect(persona)
            }}
            className={`h-7 w-7 items-center justify-center rounded-full ${
              persona === active ? 'bg-indigo-500' : 'bg-black/5 dark:bg-white/10'
            }`}
            accessibilityRole="button"
            accessibilityLabel={`Preview persona ${persona}`}>
            <Text className="text-[13px]">{PERSONA_CONTENT[persona].question.emoji}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

export function PitchProStep({ persona, onTriggerSkip }: PitchProStepProps) {
  const { t } = useTranslation()
  const isDark = useThemedColor()
  const insets = useSafeAreaInsets()
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()
  const { purchaseAnnual, restorePurchases, isLoadingPurchase, annualPackage, monthlyPackage } =
    usePremium()

  const [devPersona, setDevPersona] = useState<Persona | null>(null)
  const personaKey: Persona = devPersona ?? persona ?? 'general'
  const content = PERSONA_CONTENT[personaKey].pitch

  const annualPriceString = annualPackage?.product?.priceString ?? '—'
  const annualPriceUsd = annualPackage?.product?.price
  const monthlyPriceUsd = monthlyPackage?.product?.price
  const savingsPercent = computeSavingsPercent({
    monthlyPrice: monthlyPriceUsd,
    annualPrice: annualPriceUsd,
  })

  const fineprint = savingsPercent
    ? t('onboarding.pitch.fineprint', {
        price: annualPriceString,
        percent: savingsPercent,
      })
    : t('onboarding.pitch.fineprintNoSavings', { price: annualPriceString })

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
      <DevPersonaSwitcher active={personaKey} onSelect={setDevPersona} top={insets.top + 44} />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 88,
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 24,
        }}
        showsVerticalScrollIndicator={false}>
        <ThemedText variant="display" align="center" className="text-3xl">
          {t(content.headlineKey)}
        </ThemedText>

        <View className="mt-5 items-center">
          <HeroVisual kind={content.heroVisualKind} />

          <ThemedText variant="caption" color="muted" align="center" className="mt-3">
            {t(content.heroCaptionKey)}
          </ThemedText>
        </View>

        <View className="mt-5 flex-row flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5">
          {content.secondary.map((featureKey, index) => (
            <Fragment key={featureKey}>
              {index > 0 && <TrustDot />}
              <View className="flex-row items-center gap-1">
                <Ionicons name="checkmark-sharp" size={15} color="#34d399" />
                <ThemedText variant="caption" color="dimmed" weight="semibold">
                  {t(`onboarding.pitch.secondaryShort.${featureKey}`)}
                </ThemedText>
              </View>
            </Fragment>
          ))}
          <TrustDot />
          <ThemedText variant="caption" color="dimmed" weight="semibold">
            {t('paywall.socialProofShort', {
              rating: SOCIAL_PROOF.rating,
              users: SOCIAL_PROOF.usersLabel,
            })}
          </ThemedText>
        </View>

        <View className={`mt-5 rounded-2xl p-4 ${isDark ? 'bg-white/5' : 'bg-indigo-500/[0.06]'}`}>
          <ThemedText variant="caption" color="muted" className="mb-3 uppercase">
            {t('onboarding.pitch.timelineHeader')}
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
                {t(`onboarding.pitch.${row.key}`)}
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
          accessibilityLabel={t('onboarding.pitch.ctaStart')}>
          <ThemedText variant="buttonLarge" color="inverse">
            {t('onboarding.pitch.ctaStart')}
          </ThemedText>
          <Ionicons name="arrow-forward" size={20} color="#ffffff" />
        </GradientButton>
        <ThemedText variant="caption" color="muted" align="center" className="mt-2">
          {`${fineprint} · ${t('onboarding.pitch.reassurance')}`}
        </ThemedText>

        <View className="mt-3 flex-row flex-wrap items-center justify-center">
          <Pressable
            onPress={onTriggerSkip}
            disabled={isLoadingPurchase}
            className="py-2"
            accessibilityRole="button">
            <ThemedText variant="body" weight="semibold" color="dimmed" className="underline">
              {t('onboarding.pitch.ctaSkip')}
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
              {t('onboarding.pitch.restore')}
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  )
}
