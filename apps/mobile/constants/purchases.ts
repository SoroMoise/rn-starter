// apps/mobile/constants/purchases.ts
import Constants from 'expo-constants'
import { Platform } from 'react-native'

const purchasesConfig = Constants.expoConfig?.extra?.purchases ?? {}

export const REVENUECAT_API_KEY: string =
  Platform.OS === 'ios' ? (purchasesConfig.iosApiKey ?? '') : (purchasesConfig.androidApiKey ?? '')

export const ENTITLEMENT_PREMIUM = 'Currency converter Pro'

export const PRODUCT_IDS = {
  MONTHLY: 'premium:premium-monthly',
  ANNUAL: 'premium:premium-yearly',
} as const

export type PlanType = 'monthly' | 'annual'

export const TRIAL_DURATION_DAYS = 7

export const FREE_FEATURES = [
  { key: 'liveRates', i18nKey: 'paywall.featureLiveRates' },
  { key: 'charts', i18nKey: 'paywall.featureCharts' },
] as const

export const PREMIUM_FEATURES = [
  { key: 'noAds', i18nKey: 'paywall.featureNoAds', icon: 'ban-outline' },
  { key: 'rateAlerts', i18nKey: 'paywall.featureRateAlerts', icon: 'notifications-outline' },
  { key: 'homeWidget', i18nKey: 'paywall.featureHomeWidget', icon: 'phone-portrait-outline' },
  { key: 'backup', i18nKey: 'paywall.featureBackup', icon: 'cloud-upload-outline' },
  { key: 'export', i18nKey: 'paywall.featureExport', icon: 'document-text-outline' },
] as const

const gracePeriodConfig = Constants.expoConfig?.extra?.purchases as
  | { gracePeriodDays?: number }
  | undefined

export const SUBSCRIPTION_GRACE_PERIOD_DAYS: number = gracePeriodConfig?.gracePeriodDays ?? 7

export const SUBSCRIPTION_GRACE_PERIOD_MS: number =
  SUBSCRIPTION_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
