/**
 * Minimum star count to trigger native review / Play Store redirect.
 * Below this threshold: show thank-you alert only.
 */
export const MIN_STARS_FOR_STORE_REDIRECT = 3

const ANDROID_PACKAGE_ID = 'com.yourcompany.rnstarter'

export const PLAY_STORE_RATE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_ID}&reviewId=0`
