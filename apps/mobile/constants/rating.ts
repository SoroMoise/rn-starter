export const SENTIMENT_GATE_ENABLED: boolean = false

export const MIN_STARS_FOR_STORE_REDIRECT = 3

const ANDROID_PACKAGE_ID = 'com.yourcompany.rnstarter'

export const PLAY_STORE_MARKET_URL = `market://details?id=${ANDROID_PACKAGE_ID}`
export const PLAY_STORE_WEB_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_ID}`

const APP_STORE_APP_ID: string | null = null

export const APP_STORE_URL: string | undefined = APP_STORE_APP_ID
  ? `https://apps.apple.com/app/id${APP_STORE_APP_ID}`
  : undefined

export type RatingMoment = 'action_completed'

export const STRONG_RATING_MOMENTS: readonly RatingMoment[] = ['action_completed']

export const RATING_ASK_MIN_AWAY_MS = 5 * 60 * 1000
export const RATING_ASK_SETTLE_MS = 1200

export const REVIEW_REQUEST_CONFIG = {
  requestCap: 3,
  cooldownDays: 14,
  backoffMultiplier: 3,
  softResetDays: 180,
  minDaysSinceInstall: 2,
  minSessions: 2,
  minActions: 7,
  adQuietSeconds: 120,
} as const
