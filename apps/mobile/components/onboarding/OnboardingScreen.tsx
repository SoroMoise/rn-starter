import { AppSystemBars } from '@/components/AppSystemBars'
import { OnboardingBackButton } from '@/components/onboarding/components/OnboardingBackButton'
import { OnboardingProgressBar } from '@/components/onboarding/components/OnboardingProgressBar'
import { ProWelcomeModal } from '@/components/onboarding/ProWelcomeModal'
import { ExitIntentSheet } from '@/components/onboarding/steps/ExitIntentSheet'
import { LanguageStep } from '@/components/onboarding/steps/LanguageStep'
import { PremiumValueStep } from '@/components/onboarding/steps/PremiumValueStep'
import { WelcomeStep } from '@/components/onboarding/steps/WelcomeStep'
import { GradientButton } from '@/components/ui/GradientButton'
import { ThemedText } from '@/components/ui/ThemedText'
import { usePremium } from '@/hooks/usePremium'
import { analyticsService } from '@/services/api/analyticsService'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { useSettingsStore } from '@/stores/settingsStore'
import type { Language } from '@/types'
import { triggerLight, triggerSuccess } from '@/utils/haptics'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useThemedColor } from '@hooks/useThemedColor'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const STEPS = ['welcome', 'premium', 'language'] as const
type StepKind = (typeof STEPS)[number]
const STEP_INDEX: Record<StepKind, number> = {
  welcome: 0,
  premium: 1,
  language: 2,
}
const TOTAL_STEPS = STEPS.length

function stepName(index: number): StepKind {
  return STEPS[index] ?? 'welcome'
}

export function OnboardingScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const isDark = useThemedColor()

  const [currentStep, setCurrentStep] = useState(0)
  const [exitIntentVisible, setExitIntentVisible] = useState(false)
  const [proWelcomeVisible, setProWelcomeVisible] = useState(false)
  const onboardingStartTimeRef = useRef(Date.now())
  const slideStartTimeRef = useRef(Date.now())
  const premiumEnteredAtRef = useRef(0)

  const attemptedSkipTrial = useOnboardingStore((s) => s.attemptedSkipTrial)
  const markAttemptedSkipTrial = useOnboardingStore((s) => s.markAttemptedSkipTrial)
  const markCompleted = useOnboardingStore((s) => s.markCompleted)
  const setCurrentSlide = useOnboardingStore((s) => s.setCurrentSlide)
  const hasSeenProWelcome = useOnboardingStore((s) => s.hasSeenProWelcome)
  const markProWelcomeSeen = useOnboardingStore((s) => s.markProWelcomeSeen)

  const setLanguage = useSettingsStore((s) => s.setLanguage)
  const currentLanguage = useSettingsStore((s) => s.settings.language)

  const { isPremium, isInitialized: isSubscriptionInitialized } = usePremium()

  useEffect(() => {
    analyticsService.track('onboarding_started')
    analyticsService.logOnboardingStepViewed({ stepIndex: 0, timeOnPreviousStepS: null })
  }, [])

  useEffect(() => {
    if (!isSubscriptionInitialized || !isPremium || hasSeenProWelcome) return
    if (currentStep >= STEP_INDEX.premium) return
    setProWelcomeVisible(true)
    markProWelcomeSeen()
    analyticsService.track('onboarding_pro_detected', {
      step: stepName(currentStep),
    })
  }, [isSubscriptionInitialized, isPremium, hasSeenProWelcome, currentStep, markProWelcomeSeen])

  const goToStep = useCallback(
    (step: number) => {
      triggerLight()
      const elapsedS = Math.round((Date.now() - slideStartTimeRef.current) / 1000)
      slideStartTimeRef.current = Date.now()
      setCurrentStep(step)
      setCurrentSlide(step)
      analyticsService.logOnboardingStepViewed({
        stepIndex: step,
        timeOnPreviousStepS: elapsedS,
      })
      if (stepName(step) === 'premium') {
        premiumEnteredAtRef.current = Date.now()
      }
    },
    [setCurrentSlide]
  )

  const handleComplete = useCallback(() => {
    analyticsService.track('onboarding_completed', {
      duration_s: Math.round((Date.now() - onboardingStartTimeRef.current) / 1000),
    })
    markCompleted()
    triggerSuccess()
  }, [markCompleted])

  const handleProWelcomeContinue = useCallback(() => {
    triggerLight()
    setProWelcomeVisible(false)
    analyticsService.track('onboarding_pro_welcome_outcome', { outcome: 'continue' })
  }, [])

  const handleProWelcomeSkip = useCallback(() => {
    setProWelcomeVisible(false)
    analyticsService.track('onboarding_pro_welcome_outcome', { outcome: 'skip' })
    handleComplete()
  }, [handleComplete])

  const handleNextFromWelcome = useCallback(() => {
    goToStep(STEP_INDEX.premium)
  }, [goToStep])

  const handleNextFromLanguage = useCallback(() => {
    handleComplete()
  }, [handleComplete])

  const openExitIntent = useCallback(() => {
    if (attemptedSkipTrial) {
      goToStep(STEP_INDEX.language)
      return
    }
    markAttemptedSkipTrial()
    analyticsService.track('onboarding_exit_intent_shown', {
      time_on_pitch_s: Math.round((Date.now() - premiumEnteredAtRef.current) / 1000),
    })
    setExitIntentVisible(true)
  }, [attemptedSkipTrial, markAttemptedSkipTrial, goToStep])

  const handleExitRecovered = useCallback(() => {
    setExitIntentVisible(false)
    analyticsService.track('onboarding_exit_intent_outcome', {
      outcome: 'recovered_to_trial',
    })
    handleComplete()
  }, [handleComplete])

  const handleExitConfirmedSkip = useCallback(() => {
    setExitIntentVisible(false)
    analyticsService.track('onboarding_exit_intent_outcome', {
      outcome: 'confirmed_skip',
    })
    goToStep(STEP_INDEX.language)
  }, [goToStep])

  const handleExitDismissedOutside = useCallback(() => {
    setExitIntentVisible(false)
    analyticsService.track('onboarding_exit_intent_outcome', {
      outcome: 'dismissed_outside',
    })
    goToStep(STEP_INDEX.language)
  }, [goToStep])

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      analyticsService.logOnboardingBackPressed(currentStep)
      goToStep(currentStep - 1)
    }
  }, [currentStep, goToStep])

  const handleLanguageChange = useCallback(
    (language: Language) => {
      analyticsService.track('settings_language_changed', {
        language_code: language,
        previous_language: currentLanguage,
      })
      setLanguage(language)
    },
    [setLanguage, currentLanguage]
  )

  const isFirstStep = currentStep === 0
  const stepKind = stepName(currentStep)

  return (
    <View className={`flex-1 ${isDark ? 'bg-[#0f0c29]' : 'bg-[#f8faff]'}`}>
      <AppSystemBars
        statusStyle={isDark ? 'light' : 'dark'}
        navigationStyle={isDark ? 'dark' : 'light'}
      />

      <View className="absolute left-6 right-6 z-20" style={{ top: insets.top + 10 }}>
        <OnboardingProgressBar totalSteps={TOTAL_STEPS} currentStep={currentStep} />
      </View>

      {!isFirstStep && stepKind !== 'premium' && (
        <Animated.View
          entering={FadeIn.duration(300)}
          className="absolute right-6 z-30"
          style={{ top: insets.top + 24 }}>
          <Pressable
            onPress={handleNextFromLanguage}
            className="px-4 py-2"
            accessibilityRole="button"
            accessibilityLabel={t('onboarding.skip')}>
            <ThemedText variant="label" color="muted">
              {t('onboarding.skip')}
            </ThemedText>
          </Pressable>
        </Animated.View>
      )}

      <Animated.View key={currentStep} entering={FadeIn.duration(300)} className="flex-1">
        {stepKind === 'welcome' && <WelcomeStep />}
        {stepKind === 'premium' && <PremiumValueStep onTriggerSkip={openExitIntent} />}
        {stepKind === 'language' && <LanguageStep onSelect={handleLanguageChange} />}
      </Animated.View>

      {stepKind !== 'premium' && (
        <View className="absolute left-0 right-0 z-10 px-6" style={{ bottom: insets.bottom + 16 }}>
          <View className="flex-row items-center gap-3">
            {!isFirstStep && <OnboardingBackButton onPress={handlePrevious} />}

            {stepKind === 'welcome' && (
              <GradientButton
                onPress={handleNextFromWelcome}
                colors={['#3b82f6', '#6366f1', '#8b5cf6']}
                style={{ height: 58, flex: 1, borderRadius: 16 }}
                gradientStyle={{ height: '100%', gap: 12 }}
                pressScale={0}
                pressOpacity={0.75}
                accessibilityLabel={t('onboarding.welcome.cta')}>
                <ThemedText variant="buttonLarge" color="inverse">
                  {t('onboarding.welcome.cta')}
                </ThemedText>
                <Ionicons name="arrow-forward" size={20} color="#ffffff" />
              </GradientButton>
            )}

            {stepKind === 'language' && (
              <GradientButton
                onPress={handleNextFromLanguage}
                colors={['#3b82f6', '#6366f1', '#8b5cf6']}
                style={{ height: 58, flex: 1, borderRadius: 16 }}
                gradientStyle={{ height: '100%', gap: 12 }}
                pressScale={0}
                pressOpacity={0.75}
                accessibilityLabel={t('onboarding.language.cta')}>
                <ThemedText variant="buttonLarge" color="inverse">
                  {t('onboarding.language.cta')}
                </ThemedText>
              </GradientButton>
            )}
          </View>

          {stepKind === 'welcome' && (
            <ThemedText variant="caption" color="muted" align="center" className="mt-2">
              {t('onboarding.welcome.reassurance')}
            </ThemedText>
          )}
        </View>
      )}

      {stepKind === 'premium' && (
        <View className="absolute left-6 z-30" style={{ top: insets.top + 24 }}>
          <OnboardingBackButton onPress={handlePrevious} />
        </View>
      )}

      <ExitIntentSheet
        visible={exitIntentVisible}
        onRecovered={handleExitRecovered}
        onConfirmedSkip={handleExitConfirmedSkip}
        onDismissedOutside={handleExitDismissedOutside}
      />

      <ProWelcomeModal
        visible={proWelcomeVisible}
        onSkip={handleProWelcomeSkip}
        onContinue={handleProWelcomeContinue}
      />
    </View>
  )
}
