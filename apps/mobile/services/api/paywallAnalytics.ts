import { analyticsService } from '@/services/api/analyticsService'
import { engagementService } from '@/services/api/engagementService'
import { engagementStorage } from '@/services/storage/domains/engagement'
import type { OfferingPlan, PlanPeriod } from '@/utils/offerings'

export type ConversionContext = {
  session_count: number
  days_since_install: number
  paywall_count: number
  total_actions: number
}

// One place composes the funnel's paywall events, so a field added to one cannot miss the
// others: two events of the same funnel that stop carrying the same keys cannot be joined.
export const paywallAnalytics = {
  async trackShown({
    source,
    offeringId,
    plans,
    defaultPlan,
  }: {
    source: string
    offeringId: string
    plans: OfferingPlan[]
    defaultPlan: OfferingPlan | null
  }): Promise<void> {
    const paywallCount = await engagementService.incrementPaywallCount()
    const sessionCtx = engagementService.getSessionContext()

    analyticsService.track('paywall_shown', {
      source,
      offering_id: offeringId,
      session_count: sessionCtx?.sessionCount ?? 0,
      paywall_count: paywallCount,
      has_trial_offer: plans.some((plan) => plan.hasTrial),
      total_actions: engagementStorage.getActionCount(),
      ...(defaultPlan && {
        default_plan: defaultPlan.period,
        default_price: defaultPlan.pkg.product.price,
        currency: defaultPlan.pkg.product.currencyCode,
      }),
    })
  },

  trackDismissed({
    source,
    openedAtMs,
    selectedPlan,
    lifetimeOfferShown,
  }: {
    source: string
    openedAtMs: number
    selectedPlan: PlanPeriod | null
    lifetimeOfferShown: boolean
  }): void {
    analyticsService.track('paywall_dismissed', {
      source,
      time_on_paywall_s: Math.round((Date.now() - openedAtMs) / 1000),
      selected_plan: selectedPlan ?? 'none',
      lifetime_offer_shown: lifetimeOfferShown,
    })
  },

  trackLifetimeOfferShown({ source, plan }: { source: string; plan: OfferingPlan }): void {
    analyticsService.track('paywall_lifetime_offer_shown', {
      source,
      product_id: plan.pkg.product.identifier,
      price: plan.pkg.product.price,
      currency: plan.pkg.product.currencyCode,
    })
  },

  async conversionContext(): Promise<ConversionContext> {
    const sessionCtx = engagementService.getSessionContext()
    const { paywallCount } = await engagementService.getPaywallContext()
    return {
      session_count: sessionCtx?.sessionCount ?? 0,
      days_since_install: sessionCtx?.daysSinceInstall ?? 0,
      paywall_count: paywallCount,
      total_actions: engagementStorage.getActionCount(),
    }
  },
}
