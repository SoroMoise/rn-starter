/**
 * Sentiment pre-prompt, **off**. Play's in-app review guidelines forbid asking
 * anything before the review card — opinion questions ("Do you like the app?")
 * and predictive ones (a star picker) alike — and a star gate does both. The
 * moment and cadence gates do the filtering instead, which is the targeting Play
 * explicitly endorses.
 *
 * Nothing reads this flag: `AppRatingModal` still compiles, mounted nowhere, so
 * bringing the pre-prompt back means wiring it — with a reason Play would
 * accept — not flipping this to `true`.
 */
export const SENTIMENT_GATE_ENABLED: boolean = false

/** The star count from which the pre-prompt would send a rating on to the store. */
export const MIN_STARS_FOR_STORE_REDIRECT = 3

const ANDROID_PACKAGE_ID = 'com.yourcompany.rnstarter'

// Derived from the package id, which is fixed — Android needs no configured URL.
// `market://` is intercepted by the installed Play app and lands on the listing
// directly; the https form only serves devices where nothing intercepts it.
export const PLAY_STORE_MARKET_URL = `market://details?id=${ANDROID_PACKAGE_ID}`
export const PLAY_STORE_WEB_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_ID}`

/**
 * The App Store listing is addressed by App Store Connect's numeric id, which
 * only exists once the app is registered there — the bundle id opens nothing.
 * `null` until the iOS release; filling it in here is the whole iOS wiring.
 */
const APP_STORE_APP_ID: string | null = null

export const APP_STORE_URL: string | undefined = APP_STORE_APP_ID
  ? `https://apps.apple.com/app/id${APP_STORE_APP_ID}`
  : undefined

/**
 * Where an ask may come from: a point where the app has just delivered what the user came for,
 * never a step inside a task. Add your own, and list in `STRONG_RATING_MOMENTS` the ones allowed
 * to open Play's card — any other is refused as `weak_moment`, which measures a candidate before
 * it is promoted. `action_completed` is `recordAction()`'s, and it waits for the user to come
 * back: the instant an action completes, they are reading its result.
 */
export type RatingMoment = 'action_completed'

export const STRONG_RATING_MOMENTS: readonly RatingMoment[] = ['action_completed']

/**
 * A deferred ask is raised at a launch, or on a return after at least `RATING_ASK_MIN_AWAY_MS`
 * away. Android reports every activity drawn over the app as a background — the interstitial,
 * the rewarded video, the billing sheet, a permission dialog, Play's own card — so a shorter
 * absence is the app's own flow, not the user coming back. The ask then waits
 * `RATING_ASK_SETTLE_MS`, so it lands on a screen that is back rather than on the frame that
 * restores it.
 */
export const RATING_ASK_MIN_AWAY_MS = 5 * 60 * 1000
export const RATING_ASK_SETTLE_MS = 1200

/**
 * When a qualifying moment may become a request to Play (`services/api/reviewPolicy.ts`).
 * Requests come in streaks of at most `requestCap`; after the n-th, the next one waits
 * `cooldownDays × backoffMultiplier^n` — 42 days, then 126. `softResetDays` without a request
 * ends a streak, and it must stay above the longest of those cooldowns
 * (`cooldownDays × backoffMultiplier^(requestCap − 1)`): below it, every re-ask would land past
 * the reset, restart the count, and the cap would never bind.
 */
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
