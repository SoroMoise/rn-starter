import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { TestIds } from 'react-native-google-mobile-ads'

const admobConfig = Constants.expoConfig?.extra?.admob || {}

const getBannerIdForPlatform = (androidId?: string, iosId?: string): string => {
  if (__DEV__) {
    return TestIds.BANNER
  }
  return Platform.OS === 'android' ? androidId || '' : iosId || ''
}

export const ADMOB_INDEX_BANNER_ID = getBannerIdForPlatform(
  admobConfig.androidBannerIndexId,
  admobConfig.iosBannerIndexId
)

export const ADMOB_STATISTICS_BANNER_ID = getBannerIdForPlatform(
  admobConfig.androidBannerStatisticsId,
  admobConfig.iosBannerStatisticsId
)

export const ADMOB_SETTINGS_BANNER_ID = getBannerIdForPlatform(
  admobConfig.androidBannerSettingsId,
  admobConfig.iosBannerSettingsId
)

export const ADMOB_INTERSTITIAL_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : Platform.OS === 'android'
    ? admobConfig.androidInterstitialId || ''
    : admobConfig.iosInterstitialId || ''

export const ADMOB_REWARDED_ID = __DEV__
  ? TestIds.REWARDED
  : Platform.OS === 'android'
    ? admobConfig.androidRewardedId || ''
    : admobConfig.iosRewardedId || ''

export const AD_BANNER_INDEX_ENABLED = admobConfig.bannerIndexEnabled !== false
export const AD_BANNER_STATISTICS_ENABLED = admobConfig.bannerStatisticsEnabled !== false
export const AD_BANNER_SETTINGS_ENABLED = admobConfig.bannerSettingsEnabled !== false
export const AD_INTERSTITIAL_ENABLED = admobConfig.interstitialEnabled !== false
export const AD_REWARDED_ENABLED = admobConfig.rewardedEnabled !== false
export const AD_REWARDED_FREE_DURATION_MINUTES: number =
  admobConfig.rewardedFreeDurationMinutes ?? 60
