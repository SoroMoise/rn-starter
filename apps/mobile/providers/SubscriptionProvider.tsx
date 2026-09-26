import { PaywallModal } from '@/components/paywall/PaywallModal'
import {
  ENTITLEMENT_PREMIUM,
  SUBSCRIPTION_GRACE_PERIOD_MS,
  type PurchaseOrigin,
} from '@/constants/purchases'
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
import { subscriptionStorage } from '@/services/storage/domains/subscription'
import { useOnboardingStore } from '@/stores/onboardingStore'
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

// Play reports a subscription and its base plan apart, while the store product carries them
// joined (`subId:basePlanId`): compared on the subscription id alone, no Play plan ever matches.
function entitlementProductIds(entitlement: PurchasesEntitlementInfo): string[] {
  const { productIdentifier, productPlanIdentifier } = entitlement
  return productPlanIdentifier
    ? [`${productIdentifier}:${productPlanIdentifier}`, productIdentifier]
    : [productIdentifier]
}

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
  const productIds = entitlementProductIds(active)
  const plan = plans.find((p) => productIds.includes(p.pkg.product.identifier))
  return plan?.period ?? 'other'
}

// The store keeps a subscription whose payment failed active through its own grace period, and
// RevenueCat flags that period; the date is when access ends if the payment is never fixed.
function readBillingIssue(customerInfo: CustomerInfo): BillingIssue | null {
  const entitlement = customerInfo.entitlements.active[ENTITLEMENT_PREMIUM]
  if (!entitlement?.billingIssueDetectedAtMillis) return null
  if (entitlement.expirationDateMillis == null) return null
  return { accessEndsAtMs: entitlement.expirationDateMillis }
}

type PremiumFlags = { isPremium: boolean; isInGracePeriod: boolean }

// Development overrides, read once. They replace the store's answer inside
// applyCustomerInfo and never reach subscriptionStorage, so dropping the variable
// brings the real tier back with nothing to undo. FORCE_FREE wins over FORCE_PRO.
function readTierOverride(): PremiumFlags | null {
  const purchases = Constants.expoConfig?.extra?.purchases
  if (purchases?.forceFree === true) return { isPremium: false, isInGracePeriod: false }
  if (purchases?.forcePro === true) return { isPremium: true, isInGracePeriod: false }
  return null
}

const TIER_OVERRIDE = readTierOverride()

// Read before the store has answered, and when it could not be asked at all — a
// subscriber on a plane keeps their Pro while the banner says the clock is running.
// A response that reports no active entitlement is a verified answer and never lands here.
function unverifiedFlags(): PremiumFlags {
  const derived = subscriptionStorage.derive(Date.now(), SUBSCRIPTION_GRACE_PERIOD_MS)
  return { isPremium: derived.isPremium, isInGracePeriod: derived.isInGracePeriod }
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast()
  const { t } = useTranslation()

  // Read once: it only seeds the two states below, and it goes to disk to do it.
  const cached = useMemo(() => TIER_OVERRIDE ?? unverifiedFlags(), [])

  const [isPremium, setIsPremium] = useState(cached.isPremium)
  const [isInGracePeriod, setIsInGracePeriod] = useState(cached.isInGracePeriod)
  const [billingIssue, setBillingIssue] = useState<BillingIssue | null>(null)
  const [managementUrl, setManagementUrl] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoadingPurchase, setIsLoadingPurchase] = useState(false)
  const [activeSubscription, setActiveSubscription] = useState<PlanPeriod | null>(null)
  const [offering, setOffering] = useState<PurchasesOffering | null>(null)
  const [isLoadingPrices, setIsLoadingPrices] = useState(true)
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

  useEffect(() => {
    AdService.setPremium(isPremium)
  }, [isPremium])

  // The single place a CustomerInfo becomes the app's tier, so the boot read, the
  // foreground sync, a purchase and a restore cannot disagree.
  const applyCustomerInfo = useCallback(
    (customerInfo: CustomerInfo): { isPremium: boolean; plan: PlanPeriod | null } => {
      if (TIER_OVERRIDE) {
        setIsPremium(TIER_OVERRIDE.isPremium)
        setIsInGracePeriod(false)
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
      setIsInGracePeriod(false)
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
      if (!TIER_OVERRIDE) {
        const flags = unverifiedFlags()
        setIsPremium(flags.isPremium)
        setIsInGracePeriod(flags.isInGracePeriod)
      }
      purchaseService.reportFailure({ error: err, source: 'subscription_sync' })
    }
  }, [applyCustomerInfo])

  const loadOfferings = useCallback(async () => {
    setIsLoadingPrices(true)
    try {
      const offerings = await purchaseService.getOfferings()
      // Only `current` — falling back to another offering would misprice the screen
      // and detach the purchase from the experiment measuring it.
      setOffering(offerings.current)
    } catch (err) {
      purchaseService.reportFailure({ error: err, source: 'offerings_load' })
    } finally {
      setIsLoadingPrices(false)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      try {
        await purchaseService.initialize()
      } catch (err) {
        purchaseService.reportFailure({ error: err, source: 'subscription_init' })
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

        // The purchase's own answer is the answer. A pending payment rejects instead of
        // resolving, so a purchase that resolves without the entitlement is a sale the
        // dashboard never attached to ENTITLEMENT_PREMIUM: the user paid, and "Welcome to
        // Pro!" would be a lie.
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
          // The store quotes its own currency: logged as USD, a ₹3,499 annual plan
          // reads as $3,499.
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
        // The store's sheet has told the user; the entitlement follows once the store settles it.
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

        // Three outcomes, not a boolean: a restore that found nothing and one that
        // genuinely brought a subscription back are the same event otherwise, and the
        // difference is the only thing the funnel is asked about here.
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
        showToast({ message: t(failureMessageKey(reason)), type: 'error' })
      } finally {
        setIsLoadingPurchase(false)
      }
    },
    [applyCustomerInfo, isPremium, showToast, t]
  )

  // The one gate every source passes, so a source that does not exist yet cannot sell to a
  // subscriber or ahead of the onboarding's own pitch — and `paywall_shown` only counts
  // impressions that could convert.
  const openPaywall = useCallback(
    async ({ source }: { source: string }): Promise<boolean> => {
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
      isInGracePeriod,
      billingIssue,
      managementUrl,
      isPaywallVisible: paywallVisible,
      activeSubscription,
      plans,
      defaultPlan,
      hasPrices: plans.length > 0,
      isLoadingPrices,
      retryPrices: loadOfferings,
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
      billingIssue,
      managementUrl,
      paywallVisible,
      activeSubscription,
      plans,
      defaultPlan,
      isLoadingPrices,
      loadOfferings,
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
