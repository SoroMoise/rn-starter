/**
 * Sentiment pre-prompt, kept wired but **off**. Play's in-app review guidelines
 * forbid asking anything before the review card — opinion questions ("Do you
 * like the app?") and predictive ones (a star picker) alike — and a star gate
 * does both. With it off, the moment and cadence gates do the filtering, which
 * is the targeting Play explicitly endorses.
 *
 * Everything behind this flag still compiles; flip it to `true` only if you have
 * a reason Play would accept.
 */
export const SENTIMENT_GATE_ENABLED: boolean = false

/**
 * Minimum star count to spend the store review flow.
 * Only consulted while `SENTIMENT_GATE_ENABLED` is on.
 */
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
