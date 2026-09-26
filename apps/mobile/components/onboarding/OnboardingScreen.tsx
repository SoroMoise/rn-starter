import { AppSystemBars } from '@/components/AppSystemBars'
import { OnboardingBackButton } from '@/components/onboarding/components/OnboardingBackButton'
import { OnboardingProgressBar } from '@/components/onboarding/components/OnboardingProgressBar'
import { ProWelcomeModal } from '@/components/onboarding/ProWelcomeModal'
import { ExitIntentSheet } from '@/components/onboarding/steps/ExitIntentSheet'
import { PremiumValueStep } from '@/components/onboarding/steps/PremiumValueStep'
import { WelcomeStep } from '@/components/onboarding/steps/WelcomeStep'
import { GradientButton } from '@/components/ui/GradientButton'
import { LanguagePicker } from '@/components/ui/LanguagePicker'
import { ThemedText } from '@/components/ui/ThemedText'
import { usePremium } from '@/hooks/usePremium'
import { analyticsService } from '@/services/api/analyticsService'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { useSettingsStore } from '@/stores/settingsStore'
import type { Language, OnboardingStepKind } from '@/types'
import { triggerLight, triggerSuccess } from '@/utils/haptics'
import { getLanguageByCode } from '@constants/languages'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useThemedColor } from '@hooks/useThemedColor'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// A step that depends on the device — a permission, a platform, a feature flag — is added here
// from what that capability reports. The answer can arrive after the first frame and change the
// list under the user, which is why every move below goes by step name, never by index.
function buildSteps(): OnboardingStepKind[] {
  return ['welcome', 'premium']
}

export function OnboardingScreen() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const isDark = useThemedColor()

  const [stepKind, setStepKind] = useState<OnboardingStepKind>('welcome')
  const [exitIntentVisible, setExitIntentVisible] = useState(false)
  const [proWelcomeVisible, setProWelcomeVisible] = useState(false)
  const [languagePickerVisible, setLanguagePickerVisible] = useState(false)
  const onboardingStartTimeRef = useRef(Date.now())
  const slideStartTimeRef = useRef(Date.now())
  const premiumEnteredAtRef = useRef(0)

  const attemptedSkipTrial = useOnboardingStore((s) => s.attemptedSkipTrial)
  const markAttemptedSkipTrial = useOnboardingStore((s) => s.markAttemptedSkipTrial)
  const markCompleted = useOnboardingStore((s) => s.markCompleted)
  const hasSeenProWelcome = useOnboardingStore((s) => s.hasSeenProWelcome)
  const markProWelcomeSeen = useOnboardingStore((s) => s.markProWelcomeSeen)

  const setLanguage = useSettingsStore((s) => s.setLanguage)
  const currentLanguage = useSettingsStore((s) => s.settings.language)

  const { isPremium, isInitialized: isSubscriptionInitialized } = usePremium()

  const steps = useMemo(buildSteps, [])
  const currentStep = Math.max(0, steps.indexOf(stepKind))

  useEffect(() => {
    analyticsService.track('onboarding_started')
    analyticsService.logOnboardingStepViewed({
      stepIndex: 0,
      stepName: 'welcome',
      timeOnPreviousStepS: null,
    })
  }, [])

  const goToStep = useCallback(
    (step: OnboardingStepKind) => {
      triggerLight()
      const elapsedS = Math.round((Date.now() - slideStartTimeRef.current) / 1000)
      slideStartTimeRef.current = Date.now()
      setStepKind(step)
      analyticsService.logOnboardingStepViewed({
        stepIndex: steps.indexOf(step),
        stepName: step,
        timeOnPreviousStepS: elapsedS,
      })
      if (step === 'premium') {
        premiumEnteredAtRef.current = Date.now()
      }
    },
    [steps]
  )

  const goNext = useCallback(() => {
    const index = steps.indexOf(stepKind)
    if (index < 0) return
    const next = steps[index + 1]
    if (next) goToStep(next)
  }, [goToStep, stepKind, steps])

  const handleComplete = useCallback(() => {
    analyticsService.track('onboarding_completed', {
      duration_s: Math.round((Date.now() - onboardingStartTimeRef.current) / 1000),
    })
    markCompleted()
    triggerSuccess()
  }, [markCompleted])

  // Keyed on the entitlement, not on a purchase call: a promise resolves before React
  // commits the new tier, and a restore or a purchase from the pitch itself calls nothing.
  useEffect(() => {
    if (!isSubscriptionInitialized || !isPremium) return

    if (stepKind === 'premium') {
      if (exitIntentVisible) {
        setExitIntentVisible(false)
        analyticsService.track('onboarding_exit_intent_outcome', { outcome: 'recovered_to_trial' })
      }
      handleComplete()
      return
    }

    if (hasSeenProWelcome) return
    setProWelcomeVisible(true)
    markProWelcomeSeen()
    analyticsService.track('onboarding_pro_detected', { step: stepKind })
  }, [
    isSubscriptionInitialized,
    isPremium,
    hasSeenProWelcome,
    stepKind,
    exitIntentVisible,
    markProWelcomeSeen,
    handleComplete,
  ])

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

  const openLanguagePicker = useCallback(() => {
    triggerLight()
    setLanguagePickerVisible(true)
  }, [])

  const openExitIntent = useCallback(() => {
    if (attemptedSkipTrial) {
      handleComplete()
      return
    }
    markAttemptedSkipTrial()
    analyticsService.track('onboarding_exit_intent_shown', {
      time_on_pitch_s: Math.round((Date.now() - premiumEnteredAtRef.current) / 1000),
    })
    setExitIntentVisible(true)
  }, [attemptedSkipTrial, markAttemptedSkipTrial, handleComplete])

  const handleExitConfirmedSkip = useCallback(() => {
    setExitIntentVisible(false)
    analyticsService.track('onboarding_exit_intent_outcome', {
      outcome: 'confirmed_skip',
    })
    handleComplete()
  }, [handleComplete])

  const handleExitDismissedOutside = useCallback(() => {
    setExitIntentVisible(false)
    analyticsService.track('onboarding_exit_intent_outcome', {
      outcome: 'dismissed_outside',
    })
    handleComplete()
  }, [handleComplete])

  const handlePrevious = useCallback(() => {
    const previous = steps[steps.indexOf(stepKind) - 1]
    if (!previous) return
    analyticsService.logOnboardingBackPressed({ fromStep: currentStep, fromStepName: stepKind })
    goToStep(previous)
  }, [currentStep, goToStep, stepKind, steps])

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

  const activeLanguage = getLanguageByCode(currentLanguage)

  return (
    <View className={`flex-1 ${isDark ? 'bg-[#0f0c29]' : 'bg-[#f8faff]'}`}>
      <AppSystemBars
        statusStyle={isDark ? 'light' : 'dark'}
        navigationStyle={isDark ? 'dark' : 'light'}
      />

      <View className="absolute left-6 right-6 z-20" style={{ top: insets.top + 10 }}>
        <OnboardingProgressBar totalSteps={steps.length} currentStep={currentStep} />
      </View>

      {stepKind === 'welcome' && (
        <Animated.View
          entering={FadeIn.duration(300)}
          className="absolute left-6 z-30"
          style={{ top: insets.top + 44 }}>
          <Pressable
            onPress={openLanguagePicker}
            className={`flex-row items-center gap-2 rounded-full px-3 py-2 ${
              isDark ? 'bg-white/10' : 'bg-black/[0.05]'
            }`}
            accessibilityRole="button"
            accessibilityLabel={t('settings.selectLanguage')}>
            <ThemedText variant="label" color="inherit">
              {activeLanguage?.flag}
            </ThemedText>
            <ThemedText variant="label" weight="medium">
              {activeLanguage?.nativeName}
            </ThemedText>
            <Ionicons name="chevron-down" size={14} color={isDark ? '#cbd5e1' : '#475569'} />
          </Pressable>
        </Animated.View>
      )}

      <Animated.View key={stepKind} entering={FadeIn.duration(300)} className="flex-1">
        {stepKind === 'welcome' && <WelcomeStep />}
        {stepKind === 'premium' && <PremiumValueStep onTriggerSkip={openExitIntent} />}
      </Animated.View>

      {stepKind === 'welcome' && (
        <View className="absolute left-0 right-0 z-10 px-6" style={{ bottom: insets.bottom + 16 }}>
          <GradientButton
            onPress={goNext}
            colors={['#3b82f6', '#6366f1', '#8b5cf6']}
            style={{ height: 58, borderRadius: 16 }}
            gradientStyle={{ height: '100%', gap: 12 }}
            pressScale={0}
            pressOpacity={0.75}
            accessibilityLabel={t('onboarding.welcome.cta')}>
            <ThemedText variant="buttonLarge" color="inverse">
              {t('onboarding.welcome.cta')}
            </ThemedText>
            <Ionicons name="arrow-forward" size={20} color="#ffffff" />
          </GradientButton>

          <ThemedText variant="caption" color="muted" align="center" className="mt-2">
            {t('onboarding.welcome.reassurance')}
          </ThemedText>
        </View>
      )}

      {stepKind === 'premium' && (
        <View className="absolute left-6 z-30" style={{ top: insets.top + 24 }}>
          <OnboardingBackButton onPress={handlePrevious} />
        </View>
      )}

      <ExitIntentSheet
        visible={exitIntentVisible}
        onConfirmedSkip={handleExitConfirmedSkip}
        onDismissedOutside={handleExitDismissedOutside}
      />

      <ProWelcomeModal
        visible={proWelcomeVisible}
        onSkip={handleProWelcomeSkip}
        onContinue={handleProWelcomeContinue}
      />

      <LanguagePicker
        visible={languagePickerVisible}
        onClose={() => setLanguagePickerVisible(false)}
        onSelect={handleLanguageChange}
        selectedLanguage={currentLanguage}
      />
    </View>
  )
}
