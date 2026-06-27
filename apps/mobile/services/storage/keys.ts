export const KEYS = {
  // Migration
  MIGRATION_DONE: '@migration_done',

  // Ad-free reward
  AD_FREE_UNTIL: '@ad_free_until',

  // Subscription offline cache
  SUBSCRIPTION_EXPIRES_AT: '@subscription_expires_at',
  SUBSCRIPTION_IS_LIFETIME: '@subscription_is_lifetime',

  // First app usage tracking
  FIRST_APP_USAGE: '@first_app_usage',
  INSTALL_DATE: '@install_date',

  // Ad execution tracking
  AD_EXECUTION_COUNT: '@ad_execution_count',
  AD_LAST_SHOWN: '@ad_last_shown',

  // Rating prompt state
  RATING_PROMPT_COUNT: '@rating_prompt_count',
  RATING_LAST_PROMPT_EXECUTION: '@rating_last_prompt_execution',
  RATING_FIRST_USAGE_DATE: '@rating_first_usage_date',
  HAS_RATED_APP: '@has_rated_app',
  RATING_DECLINED_FOREVER: '@rating_declined_forever',
  RATING_LAST_PROMPT_DATE: '@rating_last_prompt_date',

  // Engagement
  SESSION_COUNT: '@session_count',
  PAYWALL_SHOWN_COUNT: '@paywall_shown_count',
  CONTEXTUAL_PAYWALL_LAST_AT: '@contextual_paywall_last_at',
  CONTEXTUAL_PAYWALL_SHOWN_COUNT: '@contextual_paywall_shown_count',
  ENGAGEMENT_ACTION_COUNT: '@engagement_action_count',

  // Stores using direct AsyncStorage (legacy keys to migrate AS-IS)
  USER_SETTINGS: 'user_settings',
  ONBOARDING_SEEN: 'onboarding_seen',
  PULL_TO_REFRESH_TUTORIAL_SEEN: 'pull_to_refresh_tutorial_seen',

  // Alerts
  ALERTS: '@alerts',
  NOTIFICATION_PERMISSION_REQUESTED: '@notification_permission_requested',
  ALERTS_ONBOARDING_SEEN: '@alerts_onboarding_seen',
} as const
