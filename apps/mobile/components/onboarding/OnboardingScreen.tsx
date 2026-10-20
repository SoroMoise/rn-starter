import { AppSystemBars } from '@/components/AppSystemBars'
import { OnboardingBackButton } from '@/components/onboarding/components/OnboardingBackButton'
import { OnboardingProgressBar } from '@/components/onboarding/components/OnboardingProgressBar'
import { OnboardingPager } from '@/components/onboarding/components/OnboardingPager'
import { ProWelcomeModal } from '@/components/onboarding/ProWelcomeModal'
import { ExitIntentSheet } from '@/components/onboarding/steps/ExitIntentSheet'
import { PremiumValueStep } from '@/components/onboarding/steps/PremiumValueStep'
import { WelcomeStep } from '@/components/onboarding/steps/WelcomeStep'
import { LanguagePicker } from '@/components/ui/LanguagePicker'
import { GRADIENTS } from '@/constants/uiColors'
import { usePremium } from '@/hooks/usePremium'
import { analyticsService } from '@/services/api/analyticsService'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { useSettingsStore } from '@/stores/settingsStore'
import type { Language, OnboardingStepKind } from '@/types'
import { triggerLight, triggerSuccess } from '@/utils/haptics'
import { useThemedColor } from '@hooks/useThemedColor'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BackHandler, View } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// A step that depends on the device — a permission, a platform, a feature flag — is added here
// from what that capability reports. The answer can arrive after the first frame and change the
// list under the user, which is why every move below goes by step name, never by index.
function buildSteps(): OnboardingStepKind[] {
  return ['welcome', 'premium']
}

const CHROME_ENTERING = FadeIn.duration(220)
const CHROME_EXITING = FadeOut.duration(160)

export function OnboardingScreen() {
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

  // Not a route: nothing below takes the back key but the app's exit, which would throw the whole
  // flow away. The first step lets that default through — there is nothing behind it.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (currentStep === 0) return false
      handlePrevious()
      return true
    })
    return () => subscription.remove()
  }, [currentStep, handlePrevious])

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

  const renderStep = (kind: OnboardingStepKind) => {
    switch (kind) {
      case 'welcome':
        return <WelcomeStep onStart={goNext} onOpenLanguagePicker={openLanguagePicker} />
      case 'premium':
        return <PremiumValueStep onTriggerSkip={openExitIntent} />
    }
  }

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: (isDark ? GRADIENTS.onboardingStepDark : GRADIENTS.onboardingStepLight)[0],
      }}>
      <AppSystemBars
        statusStyle={isDark ? 'light' : 'dark'}
        navigationStyle={isDark ? 'dark' : 'light'}
      />

      <View className="absolute left-6 right-6 z-20" style={{ top: insets.top + 10 }}>
        <OnboardingProgressBar totalSteps={steps.length} currentStep={currentStep} />
      </View>

      <OnboardingPager
        pages={steps}
        current={stepKind}
        renderPage={renderStep}
        onBack={handlePrevious}
      />

      {currentStep > 0 && (
        <Animated.View
          entering={CHROME_ENTERING}
          exiting={CHROME_EXITING}
          className="absolute left-6 z-30"
          style={{ top: insets.top + 24 }}>
          <OnboardingBackButton onPress={handlePrevious} />
        </Animated.View>
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
