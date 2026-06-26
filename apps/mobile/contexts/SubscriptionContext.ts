import type { PlanType } from '@/constants/purchases'
import { createContext } from 'react'
import type { PurchasesPackage } from 'react-native-purchases'

export type SubscriptionContextValue = {
  isPremium: boolean
  isInitialized: boolean
  isLoadingPurchase: boolean
  isInGracePeriod: boolean
  isPaywallVisible: boolean
  activeSubscription: PlanType | null
  monthlyPackage: PurchasesPackage | null
  annualPackage: PurchasesPackage | null
  purchaseMonthly: () => Promise<void>
  purchaseAnnual: () => Promise<void>
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
  monthlyPackage: null,
  annualPackage: null,
  purchaseMonthly: async () => {},
  purchaseAnnual: async () => {},
  restorePurchases: async () => {},
  openPaywall: async () => {},
  refreshSubscription: async () => {},
}

export const SubscriptionContext = createContext<SubscriptionContextValue>(initial)
