import type { OfferingPlan, PlanPeriod } from '@/utils/offerings'
import { createContext } from 'react'

export type BillingIssue = { accessEndsAtMs: number }

export type SubscriptionContextValue = {
  isPremium: boolean
  isInitialized: boolean
  isLoadingPurchase: boolean
  isInGracePeriod: boolean
  billingIssue: BillingIssue | null
  isPaywallVisible: boolean
  activeSubscription: PlanPeriod | null
  plans: OfferingPlan[]
  defaultPlan: OfferingPlan | null
  hasPrices: boolean
  isLoadingPrices: boolean
  retryPrices: () => Promise<void>
  purchasePlan: (params: { plan: OfferingPlan; source: string }) => Promise<void>
  restorePurchases: () => Promise<void>
  openPaywall: (params: { source: string }) => Promise<boolean>
  refreshSubscription: () => Promise<void>
}

const initial: SubscriptionContextValue = {
  isPremium: false,
  isInitialized: false,
  isLoadingPurchase: false,
  isInGracePeriod: false,
  billingIssue: null,
  isPaywallVisible: false,
  activeSubscription: null,
  plans: [],
  defaultPlan: null,
  hasPrices: false,
  isLoadingPrices: false,
  retryPrices: async () => {},
  purchasePlan: async () => {},
  restorePurchases: async () => {},
  openPaywall: async () => false,
  refreshSubscription: async () => {},
}

export const SubscriptionContext = createContext<SubscriptionContextValue>(initial)
