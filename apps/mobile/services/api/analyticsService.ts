import type { PurchaseSurface } from '@/constants/purchases'
import type { RatingMoment } from '@/constants/rating'
import type { ReviewSuppressionReason } from '@/services/api/reviewPolicy'
import type { OnboardingStepKind } from '@/types'
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

  // Onboarding
  onboarding_started: undefined
  // The name travels with the event: a step list gated on the device's capabilities gives the
  // same index to different steps, and a table resolving names from it would merge them.
  onboarding_step_viewed: {
    step_index: number
    step_name: OnboardingStepKind
    time_on_previous_step_s?: number
  }
  onboarding_completed: { duration_s: number }
  onboarding_back_pressed: { from_step: number; from_step_name: OnboardingStepKind }
  onboarding_exit_intent_shown: {
    time_on_pitch_s: number
  }
  onboarding_exit_intent_outcome: {
    outcome: 'recovered_to_trial' | 'confirmed_skip' | 'dismissed_outside'
  }
  onboarding_pro_detected: {
    step: OnboardingStepKind
  }
  onboarding_pro_welcome_outcome: {
    outcome: 'skip' | 'continue'
  }

  // Actions
  action_performed: { total_actions: number }

  // Settings
  settings_theme_changed: { theme: string; previous_theme: string }
  settings_language_changed: { language_code: string; previous_language: string }
  external_link_opened: {
    link_type: 'privacy_policy' | 'terms_of_service' | 'support' | 'manage_subscription'
  }

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
  // `source` (what brought the sale up), `surface` (the screen the tap landed on) and
  // `offering_id` (which RevenueCat experiment served it) ride on every step: several
  // surfaces can sell Pro, and one unattributed conversion count cannot say which of them
  // earns its place.
  paywall_shown: {
    source: string
    offering_id: string
    session_count: number
    paywall_count: number
    has_trial_offer: boolean
    total_actions: number
    // Absent when no plan has loaded; the price is in the store's own currency.
    default_plan?: PlanPeriod
    default_price?: number
    currency?: string
  }
  paywall_dismissed: {
    source: string
    time_on_paywall_s: number
    selected_plan: PlanPeriod | 'none'
  }
  paywall_plan_selected: {
    plan: PlanPeriod
    product_id: string
    source: string
    surface: PurchaseSurface
  }
  purchase_started: {
    plan: PlanPeriod
    source: string
    surface: PurchaseSurface
    product_id: string
    offering_id: string
  }
  // A payment the store has taken but not settled: RevenueCat rejects the purchase with
  // PAYMENT_PENDING_ERROR, and the entitlement follows once the store settles it.
  purchase_pending: {
    plan: PlanPeriod
    source: string
    surface: PurchaseSurface
    product_id: string
  }
  purchase_completed: {
    plan: PlanPeriod
    source: string
    surface: PurchaseSurface
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
  purchase_failed: {
    plan: PlanPeriod
    source: string
    surface: PurchaseSurface
    error_code: string
  }
  purchase_cancelled: { plan: PlanPeriod; source: string; surface: PurchaseSurface }
  // A restore has three outcomes; `restore_purchases_completed` carries which one,
  // and `subscription_restored` fires only when something actually came back.
  restore_purchases_completed: {
    outcome: 'restored' | 'already_premium' | 'nothing_found'
    source: string
    surface: PurchaseSurface
  }
  subscription_restored: { plan: PlanPeriod }
  restore_purchases_initiated: { source: string; surface: PurchaseSurface }
  restore_purchases_failed: { error_code: string; source: string; surface: PurchaseSurface }
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

  logOnboardingStepViewed(params: {
    stepIndex: number
    stepName: OnboardingStepKind
    timeOnPreviousStepS: number | null
  }): void {
    this.track('onboarding_step_viewed', {
      step_index: params.stepIndex,
      step_name: params.stepName,
      ...(params.timeOnPreviousStepS !== null && {
        time_on_previous_step_s: params.timeOnPreviousStepS,
      }),
    })
  },

  logOnboardingBackPressed(params: { fromStep: number; fromStepName: OnboardingStepKind }): void {
    this.track('onboarding_back_pressed', {
      from_step: params.fromStep,
      from_step_name: params.fromStepName,
    })
  },
}
