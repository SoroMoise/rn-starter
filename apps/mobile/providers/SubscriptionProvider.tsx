import { PaywallModal } from '@/components/paywall/PaywallModal'
import {
  ENTITLEMENT_PREMIUM,
  PlanType,
  PRODUCT_IDS,
  SUBSCRIPTION_GRACE_PERIOD_MS,
} from '@/constants/purchases'
import { SubscriptionContext, type SubscriptionContextValue } from '@/contexts/SubscriptionContext'
import { getIsOnline } from '@/hooks/useNetworkStatus'
import { useToast } from '@/providers/ToastProvider'
import { analyticsService } from '@/services/api/analyticsService'
import { crashlyticsService } from '@/services/api/crashlyticsService'
import { engagementService } from '@/services/api/engagementService'
import { promoCoordinator } from '@/services/promo/promoCoordinator'
import { purchaseService } from '@/services/api/purchaseService'
import { engagementStorage } from '@/services/storage/domains/engagement'
import { subscriptionStorage } from '@/services/storage/domains/subscription'
import Constants from 'expo-constants'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppState, AppStateStatus } from 'react-native'
import { CustomerInfo, PurchasesError, PurchasesPackage } from 'react-native-purchases'

export { SubscriptionContext }
export type { SubscriptionContextValue }

function deriveActiveSubscription(customerInfo: CustomerInfo): PlanType | null {
  const active = customerInfo.entitlements.active[ENTITLEMENT_PREMIUM]
  if (!active) return null
  return active.productIdentifier === PRODUCT_IDS.ANNUAL ? 'annual' : 'monthly'
}

function applyEntitlement(customerInfo: CustomerInfo, nowPremium: boolean): void {
  const entitlement = customerInfo.entitlements.active[ENTITLEMENT_PREMIUM]
  subscriptionStorage.persistFromEntitlement({
    isPremiumActive: nowPremium,
    expirationDateMillis: entitlement?.expirationDateMillis ?? null,
    isOnline: getIsOnline(),
    gracePeriodMs: SUBSCRIPTION_GRACE_PERIOD_MS,
  })
}

function resolvePremiumFlags(nowPremium: boolean): {
  isPremium: boolean
  isInGracePeriod: boolean
} {
  if (nowPremium) return { isPremium: true, isInGracePeriod: false }
  // Even online, let derive() decide: the local expiry is preserved while the
  // user is in their grace window, so the banner shows and Pro access holds.
  const derived = subscriptionStorage.derive(Date.now(), SUBSCRIPTION_GRACE_PERIOD_MS)
  if (derived.isInGracePeriod) {
    return { isPremium: true, isInGracePeriod: true }
  }
  return { isPremium: false, isInGracePeriod: false }
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast()
  const { t } = useTranslation()

  const forceFree = Constants.expoConfig?.extra?.purchases?.forceFree === true

  const cached = forceFree
    ? { isPremium: false, isInGracePeriod: false }
    : subscriptionStorage.derive(Date.now(), SUBSCRIPTION_GRACE_PERIOD_MS)

  const [isPremium, setIsPremium] = useState(cached.isPremium)
  const [isInGracePeriod, setIsInGracePeriod] = useState(cached.isInGracePeriod)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoadingPurchase, setIsLoadingPurchase] = useState(false)
  const [activeSubscription, setActiveSubscription] = useState<PlanType | null>(null)
  const [annualPackage, setAnnualPackage] = useState<PurchasesPackage | null>(null)
  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null)
  const [paywallVisible, setPaywallVisible] = useState(false)

  const appState = useRef(AppState.currentState)
  const paywallSourceRef = useRef<string>('')

  const syncPremiumState = useCallback(async () => {
    try {
      const customerInfo = await purchaseService.getCustomerInfo()
      const rcPremium = forceFree ? false : purchaseService.isPremiumActive({ customerInfo })
      const plan = forceFree ? null : deriveActiveSubscription(customerInfo)

      if (!forceFree) applyEntitlement(customerInfo, rcPremium)
      const flags = forceFree
        ? { isPremium: false, isInGracePeriod: false }
        : resolvePremiumFlags(rcPremium)
      setIsPremium(flags.isPremium)
      setActiveSubscription(plan)
      setIsInGracePeriod(flags.isInGracePeriod)

      analyticsService.track('subscription_synced', {
        is_premium: flags.isPremium,
        plan: plan ?? 'none',
      })
      analyticsService.updateContext({ isPremium: flags.isPremium })
    } catch (err) {
      void crashlyticsService.recordError(err, { source: 'subscription_sync' })
    }
  }, [forceFree])

  useEffect(() => {
    const init = async () => {
      try {
        await purchaseService.initialize()
        const [customerInfo, offerings] = await Promise.all([
          purchaseService.getCustomerInfo(),
          purchaseService.getOfferings(),
        ])
        const rcPremium = forceFree ? false : purchaseService.isPremiumActive({ customerInfo })
        const plan = forceFree ? null : deriveActiveSubscription(customerInfo)

        if (!forceFree) applyEntitlement(customerInfo, rcPremium)
        const flags = forceFree
          ? { isPremium: false, isInGracePeriod: false }
          : resolvePremiumFlags(rcPremium)
        setIsPremium(flags.isPremium)
        setActiveSubscription(plan)
        setIsInGracePeriod(flags.isInGracePeriod)

        const offering = offerings.current ?? Object.values(offerings.all)[0] ?? null
        const packages = offering?.availablePackages ?? []
        setMonthlyPackage(packages.find((p) => p.product.subscriptionPeriod === 'P1M') ?? null)
        setAnnualPackage(packages.find((p) => p.product.subscriptionPeriod === 'P1Y') ?? null)
      } catch (err) {
        void crashlyticsService.recordError(err, { source: 'subscription_init' })
      } finally {
        setIsInitialized(true)
      }
    }
    void init()
  }, [forceFree])

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        void syncPremiumState()
      }
      appState.current = nextState
    })
    return () => sub.remove()
  }, [syncPremiumState])

  const handlePurchase = useCallback(
    async ({ pkg, plan }: { pkg: PurchasesPackage | null; plan: PlanType }) => {
      if (!pkg) return

      setIsLoadingPurchase(true)
      analyticsService.track('purchase_started', { plan })

      try {
        await purchaseService.purchasePackage({ pkg })
        await syncPremiumState()

        const sessionCtx = engagementService.getSessionContext()
        const { paywallCount } = await engagementService.getPaywallContext()
        const totalActions = engagementStorage.getActionCount()
        analyticsService.track('purchase_completed', {
          plan,
          revenue_usd: pkg.product.price,
          session_count: sessionCtx?.sessionCount ?? 0,
          days_since_install: sessionCtx?.daysSinceInstall ?? 0,
          paywall_count: paywallCount,
          total_actions: totalActions,
          trial_started: plan === 'annual' && !!annualPackage?.product.introPrice,
        })

        showToast({ message: t('paywall.welcomePro'), type: 'success' })
      } catch (e) {
        if (purchaseService.isUserCancelledError(e)) {
          analyticsService.track('purchase_cancelled', { plan })
          return
        }
        analyticsService.track('purchase_failed', {
          plan,
          error_code: String((e as PurchasesError)?.code ?? 'unknown'),
        })
        showToast({ message: t('paywall.errorGeneric'), type: 'error' })
      } finally {
        setIsLoadingPurchase(false)
      }
    },
    [showToast, t, syncPremiumState, annualPackage]
  )

  const purchaseMonthly = useCallback(
    () => handlePurchase({ pkg: monthlyPackage, plan: 'monthly' }),
    [handlePurchase, monthlyPackage]
  )

  const purchaseAnnual = useCallback(
    () => handlePurchase({ pkg: annualPackage, plan: 'annual' }),
    [handlePurchase, annualPackage]
  )

  const restorePurchases = useCallback(async () => {
    setIsLoadingPurchase(true)
    analyticsService.track('restore_purchases_initiated')

    const wasAlreadyPremium = isPremium

    try {
      const customerInfo = await purchaseService.restorePurchases()
      const nowPremium = purchaseService.isPremiumActive({ customerInfo })

      applyEntitlement(customerInfo, nowPremium)
      setIsPremium(nowPremium)
      setActiveSubscription(deriveActiveSubscription(customerInfo))
      setIsInGracePeriod(false)

      analyticsService.track('purchase_restored', { had_active_sub: wasAlreadyPremium })

      if (nowPremium) {
        showToast({ message: t('paywall.restoreSuccess'), type: 'success' })
      } else {
        showToast({ message: t('paywall.restoreNotFound'), type: 'info' })
      }
    } catch (e) {
      analyticsService.track('restore_purchases_failed', {
        error_code: String((e as PurchasesError)?.code ?? 'unknown'),
      })
      showToast({ message: t('paywall.errorGeneric'), type: 'error' })
    } finally {
      setIsLoadingPurchase(false)
    }
  }, [isPremium, showToast, t])

  const openPaywall = useCallback(
    async ({ source }: { source: string }) => {
      paywallSourceRef.current = source
      const paywallCount = await engagementService.incrementPaywallCount()
      const sessionCtx = engagementService.getSessionContext()
      const totalActions = engagementStorage.getActionCount()
      analyticsService.track('paywall_shown', {
        source,
        session_count: sessionCtx?.sessionCount ?? 0,
        paywall_count: paywallCount,
        has_trial_offer: !!annualPackage?.product.introPrice,
        total_actions: totalActions,
      })
      promoCoordinator.setPaywallVisible(true)
      setPaywallVisible(true)
    },
    [annualPackage]
  )

  const closePaywall = useCallback(() => {
    promoCoordinator.setPaywallVisible(false)
    setPaywallVisible(false)
  }, [])

  const contextValue = useMemo<SubscriptionContextValue>(
    () => ({
      isPremium,
      isInitialized,
      isLoadingPurchase,
      isInGracePeriod,
      isPaywallVisible: paywallVisible,
      activeSubscription,
      monthlyPackage,
      annualPackage,
      purchaseMonthly,
      purchaseAnnual,
      restorePurchases,
      openPaywall,
      refreshSubscription: syncPremiumState,
    }),
    [
      isPremium,
      isInitialized,
      isLoadingPurchase,
      isInGracePeriod,
      paywallVisible,
      activeSubscription,
      monthlyPackage,
      annualPackage,
      purchaseMonthly,
      purchaseAnnual,
      restorePurchases,
      openPaywall,
      syncPremiumState,
    ]
  )

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
      <PaywallModal
        visible={paywallVisible}
        source={paywallSourceRef.current}
        onClose={closePaywall}
      />
    </SubscriptionContext.Provider>
  )
}
