import { PaywallModal } from '@/components/paywall/PaywallModal'
import { ENTITLEMENT_PREMIUM, type PaywallSource, type PurchaseOrigin } from '@/constants/purchases'
import {
  SubscriptionContext,
  type BillingIssue,
  type SubscriptionContextValue,
} from '@/contexts/SubscriptionContext'
import { useToast } from '@/providers/ToastProvider'
import { AdService } from '@/services/api/adService'
import { analyticsService } from '@/services/api/analyticsService'
import { crashlyticsService } from '@/services/api/crashlyticsService'
import { paywallAnalytics } from '@/services/api/paywallAnalytics'
import { purchaseService, type PurchaseFailure } from '@/services/api/purchaseService'
import { promoCoordinator } from '@/services/promo/promoCoordinator'
import { sessionSignals } from '@/services/promo/sessionSignals'
import { subscriptionStorage } from '@/services/storage/domains/subscription'
import { useOnboardingStore } from '@/stores/onboardingStore'
import {
  buildOfferingPlans,
  pickDefaultPlan,
  pickLifetimeOffer,
  type OfferingPlan,
  type PlanPeriod,
} from '@/utils/offerings'
import Constants from 'expo-constants'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppState, AppStateStatus } from 'react-native'
import {
  CustomerInfo,
  PurchasesEntitlementInfo,
  PurchasesError,
  PurchasesOffering,
} from 'react-native-purchases'

export { SubscriptionContext }
export type { SubscriptionContextValue }

// A purchase made outside an offering still needs an attribution value, or the
// per-offering funnel silently drops those conversions.
const NO_OFFERING = 'none'

const ENTITLEMENT_INACTIVE = 'entitlement_inactive'

function failureMessageKey(reason: PurchaseFailure): string {
  if (reason === 'network') return 'paywall.errorNetwork'
  if (reason === 'not_allowed' || reason === 'store_problem') return 'paywall.errorStoreUnavailable'
  if (reason === 'already_owned') return 'paywall.errorAlreadyOwned'
  return 'paywall.errorGeneric'
}

export type RestoreOutcome = 'restored' | 'already_premium' | 'nothing_found'

function entitlementProductIds(entitlement: PurchasesEntitlementInfo): string[] {
  const { productIdentifier, productPlanIdentifier } = entitlement
  return productPlanIdentifier
    ? [`${productIdentifier}:${productPlanIdentifier}`, productIdentifier]
    : [productIdentifier]
}

function deriveActiveSubscription({
  customerInfo,
  plans,
}: {
  customerInfo: CustomerInfo
  plans: OfferingPlan[]
}): PlanPeriod | null {
  const active = customerInfo.entitlements.active[ENTITLEMENT_PREMIUM]
  if (!active) return null
  const productIds = entitlementProductIds(active)
  const plan = plans.find((p) => productIds.includes(p.pkg.product.identifier))
  return plan?.period ?? 'other'
}

function readBillingIssue(customerInfo: CustomerInfo): BillingIssue | null {
  const entitlement = customerInfo.entitlements.active[ENTITLEMENT_PREMIUM]
  if (!entitlement?.billingIssueDetectedAtMillis) return null
  if (entitlement.expirationDateMillis == null) return null
  return { accessEndsAtMs: entitlement.expirationDateMillis }
}

function readTierOverride(): { isPremium: boolean } | null {
  const purchases = Constants.expoConfig?.extra?.purchases
  if (purchases?.forceFree === true) return { isPremium: false }
  if (purchases?.forcePro === true) return { isPremium: true }
  return null
}

const TIER_OVERRIDE = readTierOverride()

function unverifiedIsPremium(): boolean {
  return subscriptionStorage.derive(Date.now())
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast()
  const { t } = useTranslation()

  const cachedIsPremium = useMemo(() => TIER_OVERRIDE?.isPremium ?? unverifiedIsPremium(), [])

  const [isPremium, setIsPremium] = useState(cachedIsPremium)
  const [billingIssue, setBillingIssue] = useState<BillingIssue | null>(null)
  const [managementUrl, setManagementUrl] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoadingPurchase, setIsLoadingPurchase] = useState(false)
  const [activeSubscription, setActiveSubscription] = useState<PlanPeriod | null>(null)
  const [offering, setOffering] = useState<PurchasesOffering | null>(null)
  const [isLoadingPrices, setIsLoadingPrices] = useState(true)
  const [paywallVisible, setPaywallVisible] = useState(false)

  const appState = useRef(AppState.currentState)
  const isConfiguredRef = useRef(false)
  const paywallSourceRef = useRef<PaywallSource>('settings')
  const plansRef = useRef<OfferingPlan[]>([])

  const plans = useMemo(() => buildOfferingPlans(offering), [offering])
  const defaultPlan = useMemo(() => pickDefaultPlan({ offering, plans }), [offering, plans])
  const lifetimeOffer = useMemo(
    () => pickLifetimeOffer({ offering, plans, defaultPlan }),
    [offering, plans, defaultPlan]
  )

  useEffect(() => {
    plansRef.current = plans
  }, [plans])

  useEffect(() => {
    AdService.setPremium(isPremium)
  }, [isPremium])

  const applyCustomerInfo = useCallback(
    (customerInfo: CustomerInfo): { isPremium: boolean; plan: PlanPeriod | null } => {
      if (TIER_OVERRIDE) {
        setIsPremium(TIER_OVERRIDE.isPremium)
        setBillingIssue(null)
        setManagementUrl(null)
        setActiveSubscription(null)
        analyticsService.updateContext({ isPremium: TIER_OVERRIDE.isPremium })
        return { isPremium: TIER_OVERRIDE.isPremium, plan: null }
      }

      const isActive = purchaseService.isPremiumActive({ customerInfo })
      const entitlement = customerInfo.entitlements.active[ENTITLEMENT_PREMIUM]
      const plan = deriveActiveSubscription({ customerInfo, plans: plansRef.current })

      subscriptionStorage.persistFromEntitlement({
        isPremiumActive: isActive,
        expirationDateMillis: entitlement?.expirationDateMillis ?? null,
      })

      setIsPremium(isActive)
      setBillingIssue(readBillingIssue(customerInfo))
      setManagementUrl(purchaseService.managementUrl({ customerInfo }))
      setActiveSubscription(plan)
      analyticsService.updateContext({ isPremium: isActive })

      return { isPremium: isActive, plan }
    },
    []
  )

  const syncPremiumState = useCallback(async () => {
    try {
      const applied = applyCustomerInfo(await purchaseService.getCustomerInfo())

      analyticsService.track('subscription_synced', {
        is_premium: applied.isPremium,
        plan: applied.plan ?? 'none',
      })
    } catch (err) {
      if (!TIER_OVERRIDE) setIsPremium(unverifiedIsPremium())
      purchaseService.reportFailure({ error: err, source: 'subscription_sync' })
    }
  }, [applyCustomerInfo])

  const loadOfferings = useCallback(async () => {
    setIsLoadingPrices(true)
    try {
      const offerings = await purchaseService.getOfferings()
      setOffering(offerings.current)
    } catch (err) {
      purchaseService.reportFailure({ error: err, source: 'offerings_load' })
    } finally {
      setIsLoadingPrices(false)
    }
  }, [])

  const startStore = useCallback(async () => {
    try {
      await purchaseService.initialize()
    } catch (err) {
      purchaseService.reportFailure({ error: err, source: 'subscription_init' })
      setIsLoadingPrices(false)
      return
    }
    isConfiguredRef.current = true

    await Promise.all([syncPremiumState(), loadOfferings()])
  }, [loadOfferings, syncPremiumState])

  const retryPrices = useCallback(
    () => (isConfiguredRef.current ? loadOfferings() : startStore()),
    [loadOfferings, startStore]
  )
  const refreshSubscription = useCallback(
    () => (isConfiguredRef.current ? syncPremiumState() : startStore()),
    [syncPremiumState, startStore]
  )

  useEffect(() => {
    const init = async () => {
      await startStore()
      setIsInitialized(true)
    }
    void init()
  }, [startStore])

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const isReturn = /inactive|background/.test(appState.current) && nextState === 'active'
      if (isReturn && isConfiguredRef.current) {
        void syncPremiumState()
        void loadOfferings()
      }
      appState.current = nextState
    })
    return () => sub.remove()
  }, [loadOfferings, syncPremiumState])

  const purchasePlan = useCallback(
    async ({ plan, source, surface }: { plan: OfferingPlan } & PurchaseOrigin) => {
      const product = plan.pkg.product
      const offeringId = plan.pkg.presentedOfferingContext?.offeringIdentifier ?? NO_OFFERING

      setIsLoadingPurchase(true)
      analyticsService.track('purchase_started', {
        plan: plan.period,
        source,
        surface,
        product_id: product.identifier,
        offering_id: offeringId,
      })

      try {
        const customerInfo = await purchaseService.purchasePackage({ pkg: plan.pkg })
        const applied = applyCustomerInfo(customerInfo)

        if (!purchaseService.isPremiumActive({ customerInfo })) {
          const active = Object.keys(customerInfo.entitlements.active).join(', ') || 'none'
          const message = `${product.identifier} granted no "${ENTITLEMENT_PREMIUM}" (active: ${active})`
          void crashlyticsService.recordError(new Error(message), { source: 'purchase' })
          analyticsService.track('purchase_failed', {
            plan: plan.period,
            source,
            surface,
            error_code: ENTITLEMENT_INACTIVE,
          })
          sessionSignals.markFriction('purchase_failed')
          showToast({ message: t('paywall.errorGeneric'), type: 'error' })
          return
        }

        const conversionContext = await paywallAnalytics.conversionContext()
        analyticsService.track('purchase_completed', {
          plan: plan.period,
          source,
          surface,
          product_id: product.identifier,
          offering_id: offeringId,
          revenue: product.price,
          currency: product.currencyCode,
          ...conversionContext,
          trial_started: plan.hasTrial,
        })

        if (applied.isPremium) showToast({ message: t('paywall.welcomePro'), type: 'success' })
      } catch (e) {
        const reason = purchaseService.reportFailure({ error: e, source: 'purchase' })
        if (reason === 'cancelled') {
          analyticsService.track('purchase_cancelled', { plan: plan.period, source, surface })
          return
        }
        if (reason === 'pending') {
          analyticsService.track('purchase_pending', {
            plan: plan.period,
            source,
            surface,
            product_id: product.identifier,
          })
          return
        }
        analyticsService.track('purchase_failed', {
          plan: plan.period,
          source,
          surface,
          error_code: String((e as PurchasesError)?.code ?? 'unknown'),
        })
        sessionSignals.markFriction('purchase_failed')
        showToast({ message: t(failureMessageKey(reason)), type: 'error' })
      } finally {
        setIsLoadingPurchase(false)
      }
    },
    [applyCustomerInfo, showToast, t]
  )

  const restorePurchases = useCallback(
    async ({ source, surface }: PurchaseOrigin) => {
      setIsLoadingPurchase(true)
      analyticsService.track('restore_purchases_initiated', { source, surface })

      const wasAlreadyPremium = isPremium

      try {
        const customerInfo = await purchaseService.restorePurchases()
        const { isPremium: nowPremium, plan } = applyCustomerInfo(customerInfo)

        const outcome: RestoreOutcome = !nowPremium
          ? 'nothing_found'
          : wasAlreadyPremium
            ? 'already_premium'
            : 'restored'
        analyticsService.track('restore_purchases_completed', { outcome, source, surface })
        if (outcome === 'restored') {
          analyticsService.track('subscription_restored', { plan: plan ?? 'other' })
        }

        if (nowPremium) {
          showToast({ message: t('paywall.restoreSuccess'), type: 'success' })
        } else {
          showToast({ message: t('paywall.restoreNotFound'), type: 'info' })
        }
      } catch (e) {
        const reason = purchaseService.reportFailure({ error: e, source: 'restore' })
        analyticsService.track('restore_purchases_failed', {
          error_code: String((e as PurchasesError)?.code ?? 'unknown'),
          source,
          surface,
        })
        sessionSignals.markFriction('restore_failed')
        showToast({ message: t(failureMessageKey(reason)), type: 'error' })
      } finally {
        setIsLoadingPurchase(false)
      }
    },
    [applyCustomerInfo, isPremium, showToast, t]
  )

  const openPaywall = useCallback(
    async ({ source }: { source: PaywallSource }): Promise<boolean> => {
      if (isPremium) return false
      if (!useOnboardingStore.getState().isCompleted) return false

      paywallSourceRef.current = source
      await paywallAnalytics.trackShown({
        source,
        offeringId: offering?.identifier ?? NO_OFFERING,
        plans,
        defaultPlan,
      })
      promoCoordinator.setPaywallVisible(true)
      setPaywallVisible(true)
      return true
    },
    [isPremium, offering, plans, defaultPlan]
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
      billingIssue,
      managementUrl,
      isPaywallVisible: paywallVisible,
      activeSubscription,
      plans,
      defaultPlan,
      lifetimeOffer,
      hasPrices: plans.length > 0,
      isLoadingPrices,
      retryPrices,
      purchasePlan,
      restorePurchases,
      openPaywall,
      refreshSubscription,
    }),
    [
      isPremium,
      isInitialized,
      isLoadingPurchase,
      billingIssue,
      managementUrl,
      paywallVisible,
      activeSubscription,
      plans,
      defaultPlan,
      lifetimeOffer,
      isLoadingPrices,
      retryPrices,
      purchasePlan,
      restorePurchases,
      openPaywall,
      refreshSubscription,
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
