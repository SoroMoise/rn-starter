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

  // Conversion tracking
  LAST_CONVERSION: '@last_conversion',
  TOTAL_SUCCESSFUL_CONVERSIONS: '@total_successful_conversions',

  // Offline rates
  OFFLINE_RATES: '@offline_rates',
  INITIAL_DATA_LOADED: '@initial_data_loaded',

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

  // Backup
  BACKUP_LAST_SYNC: '@backup_last_sync',
  BACKUP_USER_EMAIL: '@backup_user_email',
  BACKUP_LAST_OFFERED: '@backup_last_offered',

  // Stores using direct AsyncStorage (legacy keys to migrate AS-IS)
  USER_SETTINGS: 'user_settings',
  QUICK_CONVERSIONS: 'quick_conversions',
  ONBOARDING_SEEN: 'onboarding_seen',
  PULL_TO_REFRESH_TUTORIAL_SEEN: 'pull_to_refresh_tutorial_seen',
  EXPORT_PREFERENCES: 'export_preferences',
  EXPORT_LAST_USED: 'export_last_used',
  EXPORT_DOWNLOADS_URI: '@export_downloads_uri',

  // Widget
  WIDGET_STORE: 'widget-store',
  WIDGET_POST_PURCHASE_CARD_SHOWN: 'widget-post-purchase-card-shown',
  WIDGET_POST_PURCHASE_CARD_PENDING: 'widget-post-purchase-card-pending',
  WIDGET_TOOLTIP_SHOWN: 'widget-tooltip-shown',
  WIDGET_LAST_KNOWN_ADDED_STATE: 'widget-last-known-added-state',

  // Alerts
  ALERTS: '@alerts',
  FCM_TOKEN: '@fcm_token',
  FCM_TOKEN_REGISTERED_AT: '@fcm_token_registered_at',
  NOTIFICATION_PERMISSION_REQUESTED: '@notification_permission_requested',
  ALERTS_ONBOARDING_SEEN: '@alerts_onboarding_seen',
} as const
