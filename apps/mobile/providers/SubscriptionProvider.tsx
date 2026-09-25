import { PaywallModal } from '@/components/paywall/PaywallModal'
import { ENTITLEMENT_PREMIUM, SUBSCRIPTION_GRACE_PERIOD_MS } from '@/constants/purchases'
import { SubscriptionContext, type SubscriptionContextValue } from '@/contexts/SubscriptionContext'
import { useToast } from '@/providers/ToastProvider'
import { analyticsService } from '@/services/api/analyticsService'
import { crashlyticsService } from '@/services/api/crashlyticsService'
import { engagementService } from '@/services/api/engagementService'
import { promoCoordinator } from '@/services/promo/promoCoordinator'
import { purchaseService } from '@/services/api/purchaseService'
import { engagementStorage } from '@/services/storage/domains/engagement'
import { subscriptionStorage } from '@/services/storage/domains/subscription'
import {
  buildOfferingPlans,
  pickDefaultPlan,
  type OfferingPlan,
  type PlanPeriod,
} from '@/utils/offerings'
import Constants from 'expo-constants'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppState, AppStateStatus } from 'react-native'
import { CustomerInfo, PurchasesError, PurchasesOffering } from 'react-native-purchases'

export { SubscriptionContext }
export type { SubscriptionContextValue }

// A purchase made outside an offering still needs an attribution value, or the
// per-offering funnel silently drops those conversions.
const NO_OFFERING = 'none'

// Matched against the offer the store actually returned, never against a product id
// written here: a renamed product, a third plan or a one-time purchase must not be
// reported as something it is not.
function deriveActiveSubscription({
  customerInfo,
  plans,
}: {
  customerInfo: CustomerInfo
  plans: OfferingPlan[]
}): PlanPeriod | null {
  const active = customerInfo.entitlements.active[ENTITLEMENT_PREMIUM]
  if (!active) return null
  const plan = plans.find((p) => p.pkg.product.identifier === active.productIdentifier)
  return plan?.period ?? 'other'
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
  const [activeSubscription, setActiveSubscription] = useState<PlanPeriod | null>(null)
  const [offering, setOffering] = useState<PurchasesOffering | null>(null)
  const [paywallVisible, setPaywallVisible] = useState(false)

  const appState = useRef(AppState.currentState)
  const paywallSourceRef = useRef<string>('')
  // Read inside applyCustomerInfo, which must not re-create itself when the offer
  // reloads — the init effect depends on it.
  const plansRef = useRef<OfferingPlan[]>([])

  const plans = useMemo(() => buildOfferingPlans(offering), [offering])
  const defaultPlan = useMemo(() => pickDefaultPlan({ offering, plans }), [offering, plans])

  useEffect(() => {
    plansRef.current = plans
  }, [plans])

  // The single place a CustomerInfo becomes the app's tier, so the boot read, the
  // foreground sync, a purchase and a restore cannot disagree.
  const applyCustomerInfo = useCallback(
    (customerInfo: CustomerInfo): { isPremium: boolean; plan: PlanPeriod | null } => {
      if (forceFree) {
        setIsPremium(false)
        setIsInGracePeriod(false)
        setActiveSubscription(null)
        analyticsService.updateContext({ isPremium: false })
        return { isPremium: false, plan: null }
      }

      const isActive = purchaseService.isPremiumActive({ customerInfo })
      const entitlement = customerInfo.entitlements.active[ENTITLEMENT_PREMIUM]
      const plan = deriveActiveSubscription({ customerInfo, plans: plansRef.current })

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

  const loadOfferings = useCallback(async () => {
    try {
      const offerings = await purchaseService.getOfferings()
      // Only `current` — falling back to another offering would misprice the screen
      // and detach the purchase from the experiment measuring it.
      setOffering(offerings.current)
    } catch (err) {
      void crashlyticsService.recordError(err, { source: 'offerings_load' })
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      try {
        await purchaseService.initialize()
      } catch (err) {
        void crashlyticsService.recordError(err, { source: 'subscription_init' })
        setIsInitialized(true)
        return
      }

      // Entitlement and prices are two independent calls, each with its own error
      // boundary: a store that will not quote a price must not cost the subscriber
      // their tier, which is what a single try around Promise.all did.
      await Promise.all([syncPremiumState(), loadOfferings()])
      setIsInitialized(true)
    }
    void init()
  }, [loadOfferings, syncPremiumState])

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        void syncPremiumState()
        void loadOfferings()
      }
      appState.current = nextState
    })
    return () => sub.remove()
  }, [loadOfferings, syncPremiumState])

  const purchasePlan = useCallback(
    async ({ plan, source }: { plan: OfferingPlan; source: string }) => {
      const product = plan.pkg.product
      const offeringId = plan.pkg.presentedOfferingContext?.offeringIdentifier ?? NO_OFFERING

      setIsLoadingPurchase(true)
      analyticsService.track('purchase_started', {
        plan: plan.period,
        source,
        product_id: product.identifier,
        offering_id: offeringId,
      })

      try {
        // The purchase's own answer is the answer: a call that did not throw is not a
        // purchase that granted anything — a deferred transaction resolves with no
        // entitlement, and "Welcome to Pro!" over a free tier is a lie the user cannot check.
        const customerInfo = await purchaseService.purchasePackage({ pkg: plan.pkg })
        const applied = applyCustomerInfo(customerInfo)

        if (!applied.isPremium) {
          analyticsService.track('purchase_pending', {
            plan: plan.period,
            source,
            product_id: product.identifier,
          })
          return
        }

        const sessionCtx = engagementService.getSessionContext()
        const { paywallCount } = await engagementService.getPaywallContext()
        const totalActions = engagementStorage.getActionCount()
        analyticsService.track('purchase_completed', {
          plan: plan.period,
          source,
          product_id: product.identifier,
          offering_id: offeringId,
          // The store quotes its own currency: logged as USD, a ₹3,499 annual plan
          // reads as $3,499.
          revenue: product.price,
          currency: product.currencyCode,
          session_count: sessionCtx?.sessionCount ?? 0,
          days_since_install: sessionCtx?.daysSinceInstall ?? 0,
          paywall_count: paywallCount,
          total_actions: totalActions,
          trial_started: plan.hasTrial,
        })

        showToast({ message: t('paywall.welcomePro'), type: 'success' })
      } catch (e) {
        if (purchaseService.isUserCancelledError(e)) {
          analyticsService.track('purchase_cancelled', { plan: plan.period, source })
          return
        }
        analyticsService.track('purchase_failed', {
          plan: plan.period,
          source,
          error_code: String((e as PurchasesError)?.code ?? 'unknown'),
        })
        showToast({ message: t('paywall.errorGeneric'), type: 'error' })
      } finally {
        setIsLoadingPurchase(false)
      }
    },
    [applyCustomerInfo, showToast, t]
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
        has_trial_offer: plans.some((plan) => plan.hasTrial),
        offering_id: offering?.identifier ?? NO_OFFERING,
        total_actions: totalActions,
      })
      promoCoordinator.setPaywallVisible(true)
      setPaywallVisible(true)
    },
    [offering, plans]
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
      plans,
      defaultPlan,
      purchasePlan,
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
      plans,
      defaultPlan,
      purchasePlan,
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
