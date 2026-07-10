import type { PlanType } from '@/constants/purchases'
import { crashlyticsService } from '@/services/api/crashlyticsService'
import {
  logEvent as analyticsLogEvent,
  logScreenView as analyticsLogScreenView,
  getAnalytics,
  setUserId as setAnalyticsUserId,
  setUserProperty as setAnalyticsUserProperty,
} from '@react-native-firebase/analytics'
import Constants from 'expo-constants'

let _analytics: ReturnType<typeof getAnalytics> | null = null
const analytics = () => (_analytics ??= getAnalytics())

const ONBOARDING_STEP_NAMES = ['welcome', 'premium', 'language'] as const

type EventParams = Record<string, string | number | boolean>

type AppContext = {
  platform: string
  appVersion: string
  isPremium: boolean
}

export type AnalyticsEventMap = {
  // App lifecycle
  app_session_started: {
    language: string
    theme: string
    is_ad_free_active: boolean
    is_premium: boolean
    platform: string
    app_version: string
    session_count: number
    days_since_install: number
  }
  offline_banner_shown: undefined

  // Onboarding
  onboarding_started: undefined
  onboarding_step_viewed: {
    step_index: number
    step_name: string
    time_on_previous_step_s?: number
  }
  onboarding_step_skipped: {
    from_step: number
    from_step_name: string
    time_on_step_s: number
  }
  onboarding_completed: { duration_s: number }
  onboarding_back_pressed: { from_step: number; from_step_name: string }
  onboarding_exit_intent_shown: {
    time_on_pitch_s: number
  }
  onboarding_exit_intent_outcome: {
    outcome: 'recovered_to_trial' | 'confirmed_skip' | 'dismissed_outside'
  }
  onboarding_pro_detected: {
    step: 'welcome' | 'premium' | 'language'
  }
  onboarding_pro_welcome_outcome: {
    outcome: 'skip' | 'continue'
  }

  // Actions
  action_performed: { total_actions: number }

  // Settings
  settings_theme_changed: { theme: string; previous_theme: string }
  settings_language_changed: { language_code: string; previous_language: string }
  external_link_opened: { link_type: 'privacy_policy' | 'terms_of_service' | 'support' }

  // Ads
  rewarded_ad_result: { result: 'completed' | 'dismissed'; ad_free_duration_minutes: number }

  // Rating
  rate_app_clicked: undefined
  rating_modal_shown: { source: 'auto' | 'manual'; action_count: number }
  rating_submitted: { stars: number; source: 'auto' | 'manual'; action_count: number }
  rating_later: { source: 'auto' | 'manual' }
  rating_declined: { source: 'auto' }
  store_review_native_requested: undefined
  store_review_store_opened: { reason: string }

  // Purchases
  paywall_shown: {
    source: string
    session_count: number
    paywall_count: number
    has_trial_offer: boolean
    total_actions: number
  }
  paywall_dismissed: {
    source: string
    time_on_paywall_s: number
    selected_plan: PlanType
  }
  paywall_plan_selected: { plan: PlanType }
  purchase_started: { plan: PlanType }
  purchase_completed: {
    plan: PlanType
    revenue_usd: number
    session_count: number
    days_since_install: number
    paywall_count: number
    total_actions: number
    trial_started: boolean
  }
  purchase_failed: { plan: PlanType; error_code: string }
  purchase_cancelled: { plan: PlanType }
  purchase_restored: { had_active_sub: boolean }
  restore_purchases_initiated: undefined
  restore_purchases_failed: { error_code: string }
  subscription_synced: { is_premium: boolean; plan: string }
}

export const analyticsService = {
  _context: null as AppContext | null,

  track<K extends keyof AnalyticsEventMap>(name: K, params?: AnalyticsEventMap[K]): void {
    if (__DEV__) {
      console.log(`__DEV__ [Analytics] ${name}`, params ?? '')

      return
    }

    try {
      void analyticsLogEvent(analytics(), name, params as EventParams | undefined)
      crashlyticsService.log(`[Analytics] ${name}`)
    } catch {
      /* silent */
    }
  },

  async logScreenView(screenName: string): Promise<void> {
    if (__DEV__) {
      console.log(`__DEV__ [Analytics] screen_view: ${screenName}`)
      return
    }

    try {
      await analyticsLogScreenView(analytics(), {
        screen_name: screenName,
        screen_class: screenName,
      })
      crashlyticsService.log(`[Analytics] screen_view: ${screenName}`)
    } catch {
      /* silent */
    }
  },

  async init(context: AppContext): Promise<void> {
    this._context = context
    const appVersion = Constants.expoConfig?.version ?? 'unknown'
    try {
      await Promise.all([
        this.setUserProperty('platform', context.platform),
        this.setUserProperty('app_version', appVersion),
        this.setUserProperty('is_premium', String(context.isPremium)),
      ])
    } catch {
      /* silent */
    }
  },

  updateContext(patch: Partial<AppContext>): void {
    if (this._context) {
      this._context = { ...this._context, ...patch }
    }
    if (patch.isPremium !== undefined) {
      void this.setUserProperty('is_premium', String(patch.isPremium))
    }
  },

  async setUserProperty(name: string, value: string | null): Promise<void> {
    try {
      await setAnalyticsUserProperty(analytics(), name, value)
    } catch {
      /* silent */
    }
  },

  async setUserId(id: string | null): Promise<void> {
    try {
      await setAnalyticsUserId(analytics(), id)
    } catch {
      /* silent */
    }
  },

  logOnboardingStepViewed(params: { stepIndex: number; timeOnPreviousStepS: number | null }): void {
    this.track('onboarding_step_viewed', {
      step_index: params.stepIndex,
      step_name: ONBOARDING_STEP_NAMES[params.stepIndex] ?? `step_${params.stepIndex}`,
      ...(params.timeOnPreviousStepS !== null && {
        time_on_previous_step_s: params.timeOnPreviousStepS,
      }),
    })
  },

  logOnboardingStepSkipped(params: { fromStep: number; timeOnStepS: number }): void {
    this.track('onboarding_step_skipped', {
      from_step: params.fromStep,
      from_step_name: ONBOARDING_STEP_NAMES[params.fromStep] ?? `step_${params.fromStep}`,
      time_on_step_s: params.timeOnStepS,
    })
  },

  logOnboardingBackPressed(fromStep: number): void {
    this.track('onboarding_back_pressed', {
      from_step: fromStep,
      from_step_name: ONBOARDING_STEP_NAMES[fromStep] ?? `step_${fromStep}`,
    })
  },
}
