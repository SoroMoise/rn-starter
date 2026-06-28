// apps/mobile/constants/purchases.ts
import Constants from 'expo-constants'
import { Platform } from 'react-native'

const purchasesConfig = Constants.expoConfig?.extra?.purchases ?? {}

export const REVENUECAT_API_KEY: string =
  Platform.OS === 'ios' ? (purchasesConfig.iosApiKey ?? '') : (purchasesConfig.androidApiKey ?? '')

// RevenueCat entitlement identifier — set this to match your RevenueCat dashboard.
export const ENTITLEMENT_PREMIUM = 'premium'

export const PRODUCT_IDS = {
  MONTHLY: 'premium:premium-monthly',
  ANNUAL: 'premium:premium-yearly',
} as const

export type PlanType = 'monthly' | 'annual'

export const TRIAL_DURATION_DAYS = 7

export const FREE_FEATURES = [
  { key: 'core', i18nKey: 'paywall.featureCore' },
  { key: 'limitedSupport', i18nKey: 'paywall.featureLimitedSupport' },
] as const

export const PREMIUM_FEATURES = [
  { key: 'noAds', i18nKey: 'paywall.featureNoAds', icon: 'ban-outline' },
  { key: 'reminders', i18nKey: 'paywall.featureReminders', icon: 'notifications-outline' },
  { key: 'allFeatures', i18nKey: 'paywall.featureAll', icon: 'sparkles-outline' },
  { key: 'prioritySupport', i18nKey: 'paywall.featurePrioritySupport', icon: 'headset-outline' },
] as const

const gracePeriodConfig = Constants.expoConfig?.extra?.purchases as
  | { gracePeriodDays?: number }
  | undefined

export const SUBSCRIPTION_GRACE_PERIOD_DAYS: number = gracePeriodConfig?.gracePeriodDays ?? 7

export const SUBSCRIPTION_GRACE_PERIOD_MS: number =
  SUBSCRIPTION_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
