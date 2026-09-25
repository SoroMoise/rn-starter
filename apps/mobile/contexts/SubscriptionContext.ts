import type { OfferingPlan, PlanPeriod } from '@/utils/offerings'
import { createContext } from 'react'

export type SubscriptionContextValue = {
  isPremium: boolean
  isInitialized: boolean
  isLoadingPurchase: boolean
  isInGracePeriod: boolean
  isPaywallVisible: boolean
  activeSubscription: PlanPeriod | null
  plans: OfferingPlan[]
  defaultPlan: OfferingPlan | null
  purchasePlan: (params: { plan: OfferingPlan; source: string }) => Promise<void>
  restorePurchases: () => Promise<void>
  openPaywall: (params: { source: string }) => Promise<void>
  refreshSubscription: () => Promise<void>
}

const initial: SubscriptionContextValue = {
  isPremium: false,
  isInitialized: false,
  isLoadingPurchase: false,
  isInGracePeriod: false,
  isPaywallVisible: false,
  activeSubscription: null,
  plans: [],
  defaultPlan: null,
  purchasePlan: async () => {},
  restorePurchases: async () => {},
  openPaywall: async () => {},
  refreshSubscription: async () => {},
}

export const SubscriptionContext = createContext<SubscriptionContextValue>(initial)
