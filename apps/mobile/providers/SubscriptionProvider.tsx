import { PaywallModal } from '@/components/paywall/PaywallModal'
import { HowToAddSheet } from '@/components/widget/HowToAddSheet'
import { PostPurchaseWidgetCard } from '@/components/widget/PostPurchaseWidgetCard'
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
import { conversionStorage } from '@/services/storage/domains/conversion'
import { subscriptionStorage } from '@/services/storage/domains/subscription'
import { widgetStorage } from '@/services/storage/domains/widget'
import { widgetService } from '@/services/widget/widgetService'
import { useOnboardingStore } from '@/stores/onboardingStore'
import Constants from 'expo-constants'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppState, AppStateStatus, Platform } from 'react-native'
import { CustomerInfo, PurchasesError, PurchasesPackage } from 'react-native-purchases'
import { WidgetWatchlist } from 'widget-watchlist'

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
  const [showPostPurchaseCard, setShowPostPurchaseCard] = useState(false)
  const [howToSheetVisible, setHowToSheetVisible] = useState(false)

  const isOnboardingCompleted = useOnboardingStore((s) => s.isCompleted)

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

  useEffect(() => {
    const drainNativeAnalytics = async () => {
      let events: Awaited<ReturnType<typeof WidgetWatchlist.drainAnalytics>> = []
      try {
        events = await WidgetWatchlist.drainAnalytics(false)
      } catch (err) {
        void crashlyticsService.recordError(err, { source: 'widget_drain_analytics' })
        return
      }
      const now = Date.now()
      for (const e of events) {
        try {
          const at = typeof e.params.at === 'number' ? e.params.at : now
          const delayMs = Math.max(0, now - at)
          if (e.event === 'widget_refresh_success') {
            analyticsService.track('widget_refresh_success', { delay_ms: delayMs })
          } else if (e.event === 'widget_refresh_fail') {
            const raw = e.params.error_type
            const errorType:
              | 'network'
              | 'http_4xx'
              | 'http_429'
              | 'http_5xx'
              | 'parse'
              | 'partial'
              | 'config' =
              raw === 'network' ||
              raw === 'http_4xx' ||
              raw === 'http_429' ||
              raw === 'http_5xx' ||
              raw === 'parse' ||
              raw === 'partial' ||
              raw === 'config'
                ? raw
                : 'network'
            analyticsService.track('widget_refresh_fail', {
              error_type: errorType,
              delay_ms: delayMs,
            })
          }
        } catch (err) {
          void crashlyticsService.recordError(err, { source: 'widget_drain_event' })
        }
      }
    }

    const checkWidgetAddedState = async (state: AppStateStatus | string) => {
      if (state !== 'active') return
      void drainNativeAnalytics()
      let added: boolean
      try {
        added = await WidgetWatchlist.isWidgetAdded()
      } catch (err) {
        if (Math.random() < 0.01) {
          void crashlyticsService.recordError(err, { source: 'widget_is_added_query' })
        }
        return
      }
      // The widget only learns about the current Pro state through an explicit
      // push. Adding a widget (or tapping a stale-locked one) without an
      // intervening isPremium transition would otherwise leave it rendering
      // the locked state forever. Re-push on every foreground while a widget
      // exists so the native lock state always tracks the live subscription.
      if (added) {
        void widgetService.syncFromStorage()
      }
      const last = widgetStorage.getLastKnownAddedState()
      if (added === last) return
      widgetStorage.setLastKnownAddedState(added)
      if (added) {
        const sessionCtx = engagementService.getSessionContext()
        const { paywallCount } = await engagementService.getPaywallContext()
        analyticsService.track('widget_added', {
          is_pro: isPremium,
          days_since_install: sessionCtx?.daysSinceInstall ?? 0,
          paywall_count: paywallCount,
        })
      } else {
        analyticsService.track('widget_removed', { is_pro: isPremium })
      }
    }
    const sub = AppState.addEventListener('change', checkWidgetAddedState)
    void checkWidgetAddedState(AppState.currentState)
    return () => sub.remove()
  }, [isPremium])

  useEffect(() => {
    if (!isInitialized) return
    void widgetService.syncToNative({
      isPro: isPremium,
      expiresAtMs: subscriptionStorage.getExpiresAt(),
      gracePeriodMs: SUBSCRIPTION_GRACE_PERIOD_MS,
    })
  }, [isInitialized, isPremium])

  const presentPostPurchaseCard = useCallback(() => {
    setShowPostPurchaseCard(true)
    widgetStorage.setPostPurchaseCardShown()
    analyticsService.track('widget_post_purchase_card_shown')
  }, [])

  useEffect(() => {
    if (!isOnboardingCompleted) return
    if (widgetStorage.hasPostPurchaseCardBeenShown()) return
    if (!widgetStorage.isPostPurchaseCardPending()) return
    widgetStorage.clearPostPurchaseCardPending()
    presentPostPurchaseCard()
  }, [isOnboardingCompleted, presentPostPurchaseCard])

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
        const totalConversions = conversionStorage.getTotalSuccessful()
        analyticsService.track('purchase_completed', {
          plan,
          revenue_usd: pkg.product.price,
          session_count: sessionCtx?.sessionCount ?? 0,
          days_since_install: sessionCtx?.daysSinceInstall ?? 0,
          paywall_count: paywallCount,
          total_conversions: totalConversions,
          trial_started: plan === 'annual' && !!annualPackage?.product.introPrice,
        })

        showToast({ message: t('paywall.welcomePro'), type: 'success' })

        if (Platform.OS === 'android' && !widgetStorage.hasPostPurchaseCardBeenShown()) {
          if (useOnboardingStore.getState().isCompleted) {
            presentPostPurchaseCard()
          } else {
            widgetStorage.setPostPurchaseCardPending()
          }
        }
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
    [showToast, t, syncPremiumState, annualPackage, presentPostPurchaseCard]
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
      const totalConversions = conversionStorage.getTotalSuccessful()
      analyticsService.track('paywall_shown', {
        source,
        session_count: sessionCtx?.sessionCount ?? 0,
        paywall_count: paywallCount,
        has_trial_offer: !!annualPackage?.product.introPrice,
        total_conversions: totalConversions,
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
      <PostPurchaseWidgetCard
        visible={showPostPurchaseCard}
        onCtaTap={() => {
          analyticsService.track('widget_post_purchase_card_cta_tap')
          analyticsService.track('widget_instructions_sheet_shown', {
            entry_point: 'post_purchase_card',
          })
          setShowPostPurchaseCard(false)
          setHowToSheetVisible(true)
        }}
        onDismiss={() => {
          setShowPostPurchaseCard(false)
          analyticsService.track('widget_post_purchase_card_dismissed')
        }}
      />
      <HowToAddSheet visible={howToSheetVisible} onClose={() => setHowToSheetVisible(false)} />
    </SubscriptionContext.Provider>
  )
}
