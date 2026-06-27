import { AppSystemBars } from '@/components/AppSystemBars'
import { OnboardingBackButton } from '@/components/onboarding/components/OnboardingBackButton'
import { OnboardingProgressBar } from '@/components/onboarding/components/OnboardingProgressBar'
import { ProWelcomeModal } from '@/components/onboarding/ProWelcomeModal'
import { ExitIntentSheet } from '@/components/onboarding/steps/ExitIntentSheet'
import { PersonaQuestionStep } from '@/components/onboarding/steps/PersonaQuestionStep'
import { PitchProStep } from '@/components/onboarding/steps/PitchProStep'
import { ProActiveStep } from '@/components/onboarding/steps/ProActiveStep'
import { WelcomeStep } from '@/components/onboarding/steps/WelcomeStep'
import { GradientButton } from '@/components/ui/GradientButton'
import { LanguagePicker } from '@/components/ui/LanguagePicker'
import { ThemedText } from '@/components/ui/ThemedText'
import { PERSONA_CONTENT } from '@/constants/personaContent'
import { getLanguageByCode } from '@/constants/languages'
import { usePremium } from '@/hooks/usePremium'
import { analyticsService } from '@/services/api/analyticsService'
import { useOnboardingStore, type Persona } from '@/stores/onboardingStore'
import { useSettingsStore } from '@/stores/settingsStore'
import type { Language } from '@/types'
import { triggerLight, triggerSuccess } from '@/utils/haptics'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useThemedColor } from '@hooks/useThemedColor'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, TouchableOpacity, View } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const STEPS = ['welcome', 'persona', 'pitch'] as const
type StepKind = (typeof STEPS)[number]
const STEP_INDEX: Record<StepKind, number> = {
  welcome: 0,
  persona: 1,
  pitch: 2,
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
  const [showLanguagePicker, setShowLanguagePicker] = useState(false)
  const [exitIntentVisible, setExitIntentVisible] = useState(false)
  const [proWelcomeVisible, setProWelcomeVisible] = useState(false)
  const onboardingStartTimeRef = useRef(Date.now())
  const slideStartTimeRef = useRef(Date.now())
  const pitchEnteredAtRef = useRef(0)

  const persona = useOnboardingStore((s) => s.persona)
  const attemptedSkipTrial = useOnboardingStore((s) => s.attemptedSkipTrial)
  const setPersonaStore = useOnboardingStore((s) => s.setPersona)
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
    if (currentStep >= STEP_INDEX.pitch) return
    setProWelcomeVisible(true)
    markProWelcomeSeen()
    analyticsService.track('onboarding_pro_detected', { step: stepName(currentStep) })
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
      if (stepName(step) === 'pitch') {
        pitchEnteredAtRef.current = Date.now()
        const personaKey: Persona = persona ?? 'general'
        analyticsService.track('onboarding_pitch_viewed', {
          persona: persona ?? 'none',
          hero_feature: PERSONA_CONTENT[personaKey].pitch.heroFeatureKey,
        })
      }
    },
    [persona, setCurrentSlide]
  )

  const handleComplete = useCallback(() => {
    analyticsService.track('onboarding_completed', {
      currency: '',
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
    goToStep(STEP_INDEX.persona)
  }, [goToStep])

  const handlePersonaSelect = useCallback(
    (selected: Persona) => {
      const elapsedS = Math.round((Date.now() - slideStartTimeRef.current) / 1000)
      setPersonaStore(selected)
      analyticsService.track('onboarding_persona_selected', {
        persona: selected,
        time_on_step_s: elapsedS,
      })
      goToStep(STEP_INDEX.pitch)
    },
    [setPersonaStore, goToStep]
  )

  const handleSkipPersona = useCallback(() => {
    const elapsedS = Math.round((Date.now() - slideStartTimeRef.current) / 1000)
    analyticsService.logOnboardingStepSkipped({ fromStep: 1, timeOnStepS: elapsedS })
    setPersonaStore('general')
    goToStep(STEP_INDEX.pitch)
  }, [setPersonaStore, goToStep])

  const openExitIntent = useCallback(() => {
    if (attemptedSkipTrial) {
      handleComplete()
      return
    }
    markAttemptedSkipTrial()
    analyticsService.track('onboarding_exit_intent_shown', {
      persona: persona ?? 'none',
      time_on_pitch_s: Math.round((Date.now() - pitchEnteredAtRef.current) / 1000),
    })
    setExitIntentVisible(true)
  }, [attemptedSkipTrial, markAttemptedSkipTrial, persona, handleComplete])

  const handleExitRecovered = useCallback(() => {
    setExitIntentVisible(false)
    analyticsService.track('onboarding_exit_intent_outcome', {
      outcome: 'recovered_to_trial',
      persona: persona ?? 'none',
    })
    handleComplete()
  }, [persona, handleComplete])

  const handleExitConfirmedSkip = useCallback(() => {
    setExitIntentVisible(false)
    analyticsService.track('onboarding_exit_intent_outcome', {
      outcome: 'confirmed_skip',
      persona: persona ?? 'none',
    })
    handleComplete()
  }, [persona, handleComplete])

  const handleExitDismissedOutside = useCallback(() => {
    setExitIntentVisible(false)
    analyticsService.track('onboarding_exit_intent_outcome', {
      outcome: 'dismissed_outside',
      persona: persona ?? 'none',
    })
    handleComplete()
  }, [persona, handleComplete])

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

  const handleSkipGeneric = useCallback(() => {
    const name = stepName(currentStep)
    if (name === 'persona') return handleSkipPersona()
    if (name === 'pitch') return openExitIntent()
  }, [currentStep, handleSkipPersona, openExitIntent])

  const isFirstStep = currentStep === 0
  const stepKind = stepName(currentStep)
  const currentLangConfig = getLanguageByCode(currentLanguage)

  return (
    <View className={`flex-1 ${isDark ? 'bg-[#0f0c29]' : 'bg-[#f8faff]'}`}>
      <AppSystemBars
        statusStyle={isDark ? 'light' : 'dark'}
        navigationStyle={isDark ? 'dark' : 'light'}
      />

      <View className="absolute left-6 right-6 z-20" style={{ top: insets.top + 10 }}>
        <OnboardingProgressBar totalSteps={TOTAL_STEPS} currentStep={currentStep} />
      </View>

      {isFirstStep && (
        <Animated.View
          entering={FadeIn.duration(300)}
          className="absolute left-6 z-30"
          style={{ top: insets.top + 24 }}>
          <TouchableOpacity
            onPress={() => {
              triggerLight()
              setShowLanguagePicker(true)
            }}
            className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${
              isDark ? 'border border-white/15 bg-white/10' : 'bg-black/6 border border-black/10'
            }`}
            activeOpacity={0.5}
            accessibilityRole="button"
            accessibilityLabel={t('a11y.selectLanguage')}>
            <ThemedText color="inherit" className="text-sm">
              {currentLangConfig?.flag}
            </ThemedText>
            <ThemedText variant="label" color="muted" weight="medium">
              {currentLangConfig?.nativeName}
            </ThemedText>
            <Ionicons
              name="chevron-down"
              size={12}
              color={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.25)'}
            />
          </TouchableOpacity>
        </Animated.View>
      )}

      {!isFirstStep && stepKind !== 'pitch' && (
        <Animated.View
          entering={FadeIn.duration(300)}
          className="absolute right-6 z-30"
          style={{ top: insets.top + 24 }}>
          <Pressable
            onPress={handleSkipGeneric}
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
        {stepKind === 'persona' && (
          <PersonaQuestionStep selectedPersona={persona} onSelect={handlePersonaSelect} />
        )}
        {stepKind === 'pitch' &&
          (isSubscriptionInitialized && isPremium ? (
            <ProActiveStep onFinish={handleComplete} />
          ) : (
            <PitchProStep persona={persona} onTriggerSkip={openExitIntent} />
          ))}
      </Animated.View>

      {stepKind !== 'pitch' && stepKind !== 'persona' && (
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
          </View>

          {stepKind === 'welcome' && (
            <ThemedText variant="caption" color="muted" align="center" className="mt-2">
              {t('onboarding.welcome.reassurance')}
            </ThemedText>
          )}
        </View>
      )}

      {stepKind === 'persona' && (
        <View className="absolute left-0 right-0 z-10 px-6" style={{ bottom: insets.bottom + 16 }}>
          <View className="flex-row items-center">
            {!isFirstStep && <OnboardingBackButton onPress={handlePrevious} />}
          </View>
        </View>
      )}

      {stepKind === 'pitch' && (
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

      <LanguagePicker
        visible={showLanguagePicker}
        onClose={() => setShowLanguagePicker(false)}
        onSelect={handleLanguageChange}
        selectedLanguage={currentLanguage}
      />
    </View>
  )
}
