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

const ONBOARDING_STEP_NAMES = ['welcome', 'persona', 'currency', 'aha', 'pitch'] as const

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
    currencies_count: number
    is_ad_free_active: boolean
    is_premium: boolean
    platform: string
    app_version: string
    source_currency: string
    target_currencies: string
    session_count: number
    days_since_install: number
  }
  app_init_failed: { error_message: string }
  app_init_retried: undefined
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
  onboarding_completed: { currency: string; duration_s: number }
  onboarding_back_pressed: { from_step: number; from_step_name: string }
  pull_to_refresh_tutorial_dismissed: undefined

  // Onboarding v2 - persona-driven
  onboarding_persona_selected: {
    persona: 'traveler' | 'trader' | 'freelancer' | 'general'
    time_on_step_s: number
  }
  onboarding_currency_chosen: {
    selected_code: string
    detected_code: string
    kept_detected: boolean
  }
  onboarding_aha_interaction: {
    interactions_count: number
    persona: 'traveler' | 'trader' | 'freelancer' | 'general' | 'none'
    highest_amount_tried: number
  }
  onboarding_pitch_viewed: {
    persona: 'traveler' | 'trader' | 'freelancer' | 'general' | 'none'
    hero_feature: string
  }
  onboarding_exit_intent_shown: {
    persona: 'traveler' | 'trader' | 'freelancer' | 'general' | 'none'
    time_on_pitch_s: number
  }
  onboarding_exit_intent_outcome: {
    outcome: 'recovered_to_trial' | 'confirmed_skip' | 'dismissed_outside'
    persona: 'traveler' | 'trader' | 'freelancer' | 'general' | 'none'
  }
  onboarding_pro_detected: {
    step: 'welcome' | 'persona' | 'currency' | 'aha' | 'pitch'
  }
  onboarding_pro_welcome_outcome: {
    outcome: 'skip' | 'continue'
  }

  // Converter
  source_currency_changed: { from_code: string; to_code: string }
  target_currencies_added: { currencies_count: number; currencies: string }
  target_currency_removed: { currency_code: string; source: 'converter_swipe' | 'settings' }
  currency_swap: { from_code: string; to_code: string }
  currency_reordered: {
    currency_code: string
    from_position: number
    to_position: number
    total_currencies: number
  }
  conversion_result_copied: { currency_code: string; from_currency_code: string }
  rates_refreshed: { result: 'success' | 'error'; is_offline: boolean; data_age_s?: number }
  calculator_opened: undefined
  calculator_result_applied: undefined
  conversion_performed: {
    from_currency: string
    amount_range: 'micro' | 'small' | 'medium' | 'large' | 'xlarge'
    target_count: number
    total_conversions: number
  }

  // Statistics
  statistics_currency_changed: {
    side: 'from' | 'to'
    currency_code: string
    from_currency: string
    to_currency: string
  }
  statistics_period_changed: { period_days: number; previous_period_days: number }
  statistics_refreshed: {
    result: 'success' | 'error'
    from_currency: string
    to_currency: string
    period_days: number
  }

  // Settings
  settings_theme_changed: { theme: string; previous_theme: string }
  settings_language_changed: { language_code: string; previous_language: string }
  settings_decimals_changed: { decimals: number; previous_decimals: number }
  settings_separator_toggled: { enabled: boolean }
  settings_currencies_reset: { currencies_count_before: number }
  notif_pref_master_toggled: { enabled: boolean }
  notif_pref_quiet_hours_toggled: { enabled: boolean }
  notif_pref_quiet_hours_saved: { start: string; end: string }
  notif_pref_sound_toggled: { enabled: boolean }
  notif_pref_vibration_toggled: { enabled: boolean }
  external_link_opened: { link_type: 'privacy_policy' | 'terms_of_service' | 'support' }

  // Ads
  rewarded_ad_result: { result: 'completed' | 'dismissed'; ad_free_duration_minutes: number }

  // Rating
  rate_app_clicked: undefined
  rating_modal_shown: { source: 'auto' | 'manual'; conversion_count: number }
  rating_submitted: { stars: number; source: 'auto' | 'manual'; conversion_count: number }
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
    total_conversions: number
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
    total_conversions: number
    trial_started: boolean
  }
  purchase_failed: { plan: PlanType; error_code: string }
  purchase_cancelled: { plan: PlanType }
  purchase_restored: { had_active_sub: boolean }
  restore_purchases_initiated: undefined
  restore_purchases_failed: { error_code: string }
  subscription_synced: { is_premium: boolean; plan: string }
  premium_feature_locked: { feature_name: string }

  // Backup
  backup_connected: undefined
  backup_sync: undefined
  backup_restore: undefined
  backup_error: undefined
  backup_disconnected: undefined

  // Alerts
  alert_deeplink_consumed: { alert_id: string; from_currency: string; to_currency: string }

  // Widget
  widget_settings_entry_tapped: { is_pro: boolean }
  widget_settings_opened: { is_pro: boolean }
  widget_config_changed: { pairs_changed_count: number }
  widget_period_changed: { period_days: number; previous_period_days: number }
  widget_instructions_sheet_shown: { entry_point: 'settings' | 'post_purchase_card' }
  widget_pair_picker_opened: { slot_index: number; side: 'from' | 'to' }
  widget_pairs_reordered: { from_position: number; to_position: number }
  widget_post_purchase_card_shown: undefined
  widget_post_purchase_card_dismissed: undefined
  widget_post_purchase_card_cta_tap: undefined
  widget_tooltip_shown: { session_count: number; is_pro: boolean }
  widget_tooltip_dismissed: undefined
  widget_tooltip_cta_tap: undefined
  widget_added: { is_pro: boolean; days_since_install: number; paywall_count: number }
  widget_removed: { is_pro: boolean }
  widget_pair_tap: { from: string; to: string; position: number }
  widget_refresh_success: { delay_ms: number }
  widget_refresh_fail: {
    error_type: 'network' | 'http_4xx' | 'http_429' | 'http_5xx' | 'parse' | 'partial' | 'config'
    delay_ms: number
  }
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

  logOnboardingCompleted(params: { currencySelected: string; durationMs: number }): void {
    this.track('onboarding_completed', {
      currency: params.currencySelected,
      duration_s: Math.round(params.durationMs / 1000),
    })
  },

  logAppInitializationFailed(errorMessage: string): void {
    this.track('app_init_failed', { error_message: errorMessage.slice(0, 100) })
  },
}
