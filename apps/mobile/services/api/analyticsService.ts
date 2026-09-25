import type { RatingMoment } from '@/constants/rating'
import type { ReviewSuppressionReason } from '@/services/api/reviewPolicy'
import type { PlanPeriod } from '@/utils/offerings'
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
  rewarded_ad_result: {
    result: 'completed' | 'dismissed' | 'failed'
    ad_free_duration_minutes: number
  }

  // Rating
  rate_app_clicked: undefined
  ad_privacy_options_opened: undefined
  // A moment qualified — never that the user rated. Play reports neither whether
  // the card appeared nor its outcome; store-side truth lives in the Play Console.
  rating_ask_shown: {
    moment: RatingMoment
    request_index: number
    action_count: number
    session_count: number
    days_since_install: number
  }
  // Play is just as silent about an ask that never comes: this is the only record of why.
  rating_ask_suppressed: {
    moment: RatingMoment
    reason: ReviewSuppressionReason
    action_count: number
    session_count: number
    days_since_install: number
  }
  review_flow_launched: { duration_ms: number; likely_displayed: boolean }
  review_flow_failed: { error_code: string }
  store_listing_opened: { reason: string }
  // Emitted by nothing: the in-app pre-prompt they belong to is dormant (SENTIMENT_GATE_ENABLED).
  rating_sentiment_given: { stars: number; source: 'auto' | 'manual'; action_count: number }
  rating_later: { source: 'auto' | 'manual' }
  rating_declined: { source: 'auto' }

  // Purchases.
  // `source` (which surface opened the sale) and `offering_id` (which RevenueCat
  // experiment served it) ride on every step: eight surfaces can sell Pro, and one
  // unattributed conversion count cannot say which of them earns its place.
  paywall_shown: {
    source: string
    offering_id: string
    session_count: number
    paywall_count: number
    has_trial_offer: boolean
    total_actions: number
  }
  paywall_dismissed: {
    source: string
    time_on_paywall_s: number
    selected_plan: PlanPeriod | 'none'
  }
  paywall_plan_selected: { plan: PlanPeriod; product_id: string }
  purchase_started: {
    plan: PlanPeriod
    source: string
    product_id: string
    offering_id: string
  }
  // A call that did not throw is not a purchase that granted anything: a deferred
  // transaction resolves with no entitlement.
  purchase_pending: { plan: PlanPeriod; source: string; product_id: string }
  purchase_completed: {
    plan: PlanPeriod
    source: string
    product_id: string
    offering_id: string
    // Money carries its own currency: logged as USD, a ₹3,499 plan reads as $3,499.
    revenue: number
    currency: string
    session_count: number
    days_since_install: number
    paywall_count: number
    total_actions: number
    trial_started: boolean
  }
  purchase_failed: { plan: PlanPeriod; source: string; error_code: string }
  purchase_cancelled: { plan: PlanPeriod; source: string }
  // A restore has three outcomes; `restore_purchases_completed` carries which one,
  // and `subscription_restored` fires only when something actually came back.
  restore_purchases_completed: {
    outcome: 'restored' | 'already_premium' | 'nothing_found'
  }
  subscription_restored: { plan: PlanPeriod }
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
