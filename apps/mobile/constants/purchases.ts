import type { ContextualTrigger } from '@/constants/contextualPaywall'
import type Ionicons from '@expo/vector-icons/Ionicons'
import Constants from 'expo-constants'
import type { ComponentProps } from 'react'
import { Platform } from 'react-native'

const purchasesConfig = Constants.expoConfig?.extra?.purchases ?? {}

export const REVENUECAT_API_KEY: string =
  Platform.OS === 'ios' ? (purchasesConfig.iosApiKey ?? '') : (purchasesConfig.androidApiKey ?? '')

export const ENTITLEMENT_PREMIUM = 'premium'

export type PurchaseSurface =
  | 'paywall'
  | 'lifetime_offer'
  | 'onboarding_premium'
  | 'onboarding_exit_intent'

export type PaywallSource =
  | 'settings'
  | 'home_cta'
  | 'onboarding_premium'
  | 'onboarding_exit_intent'
  | `contextual_${ContextualTrigger}`

export type PurchaseOrigin = { source: PaywallSource; surface: PurchaseSurface }

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
  params?: Record<string, number>
}

export const PRO_BENEFITS: readonly ProBenefit[] = [
  { key: 'noAds', i18nKey: 'paywall.benefit.noAds', icon: 'ban-outline' },
]
