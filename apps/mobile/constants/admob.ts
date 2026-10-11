import { Platform } from 'react-native'
import { TestIds, type RequestOptions } from 'react-native-google-mobile-ads'

// Literals, never `.env`: the app id ships in the manifest and every unit id in the bundle's
// string table, so an env protected nothing — and an incomplete one shipped a sibling app's
// release with empty ids: no ad, no error, no revenue.
const UNIT_PENDING = null

const pickUnitId = ({
  android,
  ios,
  testId,
}: {
  android: string | null
  ios: string | null
  testId: string
}): string | null => {
  if (__DEV__) return testId
  const unitId = Platform.OS === 'android' ? android : ios
  // A template placeholder is no more a unit than a missing id: requesting it serves nothing.
  return unitId && !unitId.includes('XXXX') ? unitId : UNIT_PENDING
}

export const ADMOB_INDEX_BANNER_ID = pickUnitId({
  android: UNIT_PENDING,
  ios: UNIT_PENDING,
  testId: TestIds.BANNER,
})

export const ADMOB_SETTINGS_BANNER_ID = pickUnitId({
  android: UNIT_PENDING,
  ios: UNIT_PENDING,
  testId: TestIds.BANNER,
})

export const ADMOB_INTERSTITIAL_ID = pickUnitId({
  android: UNIT_PENDING,
  ios: UNIT_PENDING,
  testId: TestIds.INTERSTITIAL,
})

export const ADMOB_REWARDED_ID = pickUnitId({
  android: UNIT_PENDING,
  ios: UNIT_PENDING,
  testId: TestIds.REWARDED,
})

export const AD_BANNER_INDEX_ENABLED: boolean = true
export const AD_BANNER_SETTINGS_ENABLED: boolean = true
export const AD_INTERSTITIAL_ENABLED: boolean = true
export const AD_REWARDED_ENABLED: boolean = true
export const AD_REWARDED_FREE_DURATION_MINUTES: number = 60
export const AD_REWARDED_FREE_MAX_MINUTES: number = 24 * 60

export const AD_BANNER_RESERVED_HEIGHT: number = 60

// Google's publisher policies forbid personalizing ads on health or other sensitive information,
// and an app whose audience is defined by such a condition is that information: it requests
// non-personalized ads only, whatever the consent form allowed.
export const AD_NON_PERSONALIZED_ONLY: boolean = false

export const AD_REQUEST_OPTIONS: RequestOptions = {
  requestNonPersonalizedAdsOnly: AD_NON_PERSONALIZED_ONLY,
}
