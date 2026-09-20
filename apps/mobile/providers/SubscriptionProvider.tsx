import { PaywallModal } from '@/components/paywall/PaywallModal'
import {
  ENTITLEMENT_PREMIUM,
  PlanType,
  PRODUCT_IDS,
  SUBSCRIPTION_GRACE_PERIOD_MS,
} from '@/constants/purchases'
import { SubscriptionContext, type SubscriptionContextValue } from '@/contexts/SubscriptionContext'
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

// Reached only when the store could not be asked at all — a subscriber on a plane
// keeps their Pro while the banner says the clock is running. A response that
// reports no active entitlement is a verified answer and never lands here.
function unverifiedFlags(): { isPremium: boolean; isInGracePeriod: boolean } {
  const derived = subscriptionStorage.derive(Date.now(), SUBSCRIPTION_GRACE_PERIOD_MS)
  return { isPremium: derived.isPremium, isInGracePeriod: derived.isInGracePeriod }
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

  // The single place a CustomerInfo becomes the app's tier, so the boot read, the
  // foreground sync, a purchase and a restore cannot disagree.
  const applyCustomerInfo = useCallback(
    (customerInfo: CustomerInfo): { isPremium: boolean; plan: PlanType | null } => {
      if (forceFree) {
        setIsPremium(false)
        setIsInGracePeriod(false)
        setActiveSubscription(null)
        analyticsService.updateContext({ isPremium: false })
        return { isPremium: false, plan: null }
      }

      const isActive = purchaseService.isPremiumActive({ customerInfo })
      const entitlement = customerInfo.entitlements.active[ENTITLEMENT_PREMIUM]
      const plan = deriveActiveSubscription(customerInfo)

      subscriptionStorage.persistFromEntitlement({
        isPremiumActive: isActive,
        expirationDateMillis: entitlement?.expirationDateMillis ?? null,
      })

      setIsPremium(isActive)
      setIsInGracePeriod(false)
      setActiveSubscription(plan)
      analyticsService.updateContext({ isPremium: isActive })

      return { isPremium: isActive, plan }
    },
    [forceFree]
  )

  const syncPremiumState = useCallback(async () => {
    try {
      const applied = applyCustomerInfo(await purchaseService.getCustomerInfo())

      analyticsService.track('subscription_synced', {
        is_premium: applied.isPremium,
        plan: applied.plan ?? 'none',
      })
    } catch (err) {
      if (!forceFree) {
        const flags = unverifiedFlags()
        setIsPremium(flags.isPremium)
        setIsInGracePeriod(flags.isInGracePeriod)
      }
      void crashlyticsService.recordError(err, { source: 'subscription_sync' })
    }
  }, [applyCustomerInfo, forceFree])

  useEffect(() => {
    const init = async () => {
      try {
        await purchaseService.initialize()
        const [customerInfo, offerings] = await Promise.all([
          purchaseService.getCustomerInfo(),
          purchaseService.getOfferings(),
        ])
        applyCustomerInfo(customerInfo)

        const offering = offerings.current ?? Object.values(offerings.all)[0] ?? null
        const packages = offering?.availablePackages ?? []
        setMonthlyPackage(packages.find((p) => p.product.subscriptionPeriod === 'P1M') ?? null)
        setAnnualPackage(packages.find((p) => p.product.subscriptionPeriod === 'P1Y') ?? null)
      } catch (err) {
        if (!forceFree) {
          const flags = unverifiedFlags()
          setIsPremium(flags.isPremium)
          setIsInGracePeriod(flags.isInGracePeriod)
        }
        void crashlyticsService.recordError(err, { source: 'subscription_init' })
      } finally {
        setIsInitialized(true)
      }
    }
    void init()
  }, [applyCustomerInfo, forceFree])

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
      const { isPremium: nowPremium } = applyCustomerInfo(customerInfo)

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
  }, [applyCustomerInfo, isPremium, showToast, t])

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
