export const KEYS = {
  // Entitlements: the encrypted store (secure.ts) holds these, never `mmkv`
  AD_FREE_UNTIL: '@ad_free_until',
  SUBSCRIPTION_EXPIRES_AT: '@subscription_expires_at',
  SUBSCRIPTION_IS_LIFETIME: '@subscription_is_lifetime',

  // First app usage tracking
  INSTALL_DATE: '@install_date',

  // Ad execution tracking
  AD_EXECUTION_COUNT: '@ad_execution_count',
  AD_LAST_SHOWN: '@ad_last_shown',

  // Review requests
  REVIEW_REQUEST_COUNT: '@review_request_count',
  REVIEW_LAST_REQUEST_AT: '@review_last_request_at',
  REVIEW_REQUEST_ARMED: '@review_request_armed',
  HAS_RATED_APP: '@has_rated_app',
  RATING_DECLINED_FOREVER: '@rating_declined_forever',

  // Engagement
  SESSION_COUNT: '@session_count',
  PAYWALL_SHOWN_COUNT: '@paywall_shown_count',
  CONTEXTUAL_PAYWALL_LAST_AT: '@contextual_paywall_last_at',
  CONTEXTUAL_PAYWALL_SHOWN_COUNT: '@contextual_paywall_shown_count',
  ENGAGEMENT_ACTION_COUNT: '@engagement_action_count',

  // Zustand-persisted stores
  USER_SETTINGS: 'user_settings',
  ONBOARDING_SEEN: 'onboarding_seen',

  // Notifications
  NOTIFICATION_PERMISSION_REQUESTED: '@notification_permission_requested',
} as const
