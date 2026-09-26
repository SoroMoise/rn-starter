// apps/mobile/constants/purchases.ts
import type Ionicons from '@expo/vector-icons/Ionicons'
import Constants from 'expo-constants'
import type { ComponentProps } from 'react'
import { Platform } from 'react-native'

const purchasesConfig = Constants.expoConfig?.extra?.purchases ?? {}

export const REVENUECAT_API_KEY: string =
  Platform.OS === 'ios' ? (purchasesConfig.iosApiKey ?? '') : (purchasesConfig.androidApiKey ?? '')

// RevenueCat entitlement identifier — set this to match your RevenueCat dashboard.
export const ENTITLEMENT_PREMIUM = 'premium'

export type PurchaseSurface = 'paywall' | 'onboarding_premium' | 'onboarding_exit_intent'

// `source` is what brought the sale up and `surface` the screen the tap landed on. `source`
// reuses the vocabulary `openPaywall` takes: the funnel groups on it, and a new spelling splits
// the funnel in two with no error anywhere.
export type PurchaseOrigin = { source: string; surface: PurchaseSurface }

// The onboarding sells without `openPaywall`, so each of its surfaces is its own entry point.
export const ONBOARDING_PREMIUM_ORIGIN: PurchaseOrigin = {
  source: 'onboarding_premium',
  surface: 'onboarding_premium',
}

export const ONBOARDING_EXIT_INTENT_ORIGIN: PurchaseOrigin = {
  source: 'onboarding_exit_intent',
  surface: 'onboarding_exit_intent',
}

export type ProBenefit = {
  key: string
  i18nKey: string
  icon: ComponentProps<typeof Ionicons>['name']
  // Not `count`: i18next reserves that key for plural resolution.
  params?: Record<string, number>
}

// The single list behind every Pro pitch. Each entry names a limit the free tier actually
// enforces, and one that depends on the build is keyed off what delivers it (a native module
// present), never off `Platform.OS`. The starter gates its ads and nothing else.
export const PRO_BENEFITS: readonly ProBenefit[] = [
  { key: 'noAds', i18nKey: 'paywall.benefit.noAds', icon: 'ban-outline' },
]

const gracePeriodConfig = Constants.expoConfig?.extra?.purchases as
  | { gracePeriodDays?: number }
  | undefined

export const SUBSCRIPTION_GRACE_PERIOD_DAYS: number = gracePeriodConfig?.gracePeriodDays ?? 7

export const SUBSCRIPTION_GRACE_PERIOD_MS: number =
  SUBSCRIPTION_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
