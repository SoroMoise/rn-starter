import type { PurchaseOrigin } from '@/constants/purchases'
import { usePremium } from '@/hooks/usePremium'
import i18n from '@/i18n/service'
import { analyticsService } from '@/services/api/analyticsService'
import { findSavingsReference, type OfferingPlan } from '@/utils/offerings'
import { computePricePerMonth, computeSavingsPercent, formatPrice } from '@/utils/pricing'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

export type PaywallPlanOption = {
  plan: OfferingPlan
  label: string
  caption: string
  savingsBadge: string | null
  trialBadge: string | null
}

// A cycle expressed in whole months reads as "every N months"; anything else
// (a 10-day plan, a 3-week one) falls back to a generic label.
const WHOLE_MONTH_TOLERANCE = 0.01

function wholeMonths(plan: OfferingPlan): number | null {
  const months = plan.monthsPerCycle
  if (months === null) return null
  const rounded = Math.round(months)
  return Math.abs(months - rounded) < WHOLE_MONTH_TOLERANCE ? rounded : null
}

/**
 * Everything a surface says about the offer and how it buys it, so that no two surfaces can
 * describe the same plan differently. The selection starts on the offering's default plan;
 * a surface that shows no plan list simply never changes it.
 */
export function usePaywallPlans({ source, surface }: PurchaseOrigin) {
  const { t } = useTranslation()
  const { plans, defaultPlan, hasPrices, isLoadingPurchase, purchasePlan } = usePremium()

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

  // Keyed on id, not object identity — a foreground refetch rebuilds every plan object.
  const defaultPlanId = defaultPlan?.id ?? null
  useEffect(() => {
    setSelectedPlanId(defaultPlanId)
  }, [defaultPlanId])

  // A plan the store stopped offering falls back to the default rather than selling nothing.
  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) ?? defaultPlan,
    [plans, selectedPlanId, defaultPlan]
  )

  const options = useMemo<PaywallPlanOption[]>(() => {
    const savingsReference = findSavingsReference(plans)
    const referencePricePerMonth = savingsReference
      ? computePricePerMonth({
          price: savingsReference.pkg.product.price,
          monthsPerCycle: savingsReference.monthsPerCycle,
        })
      : null

    const describe = (plan: OfferingPlan): { label: string; billing: string } => {
      switch (plan.period) {
        case 'weekly':
          return { label: t('paywall.planWeekly'), billing: t('paywall.billedWeekly') }
        case 'monthly':
          return { label: t('paywall.planMonthly'), billing: t('paywall.billedMonthly') }
        case 'annual':
          return { label: t('paywall.planAnnual'), billing: t('paywall.billedAnnually') }
        case 'lifetime':
          return { label: t('paywall.planLifetime'), billing: t('paywall.billedOnce') }
        default: {
          const months = wholeMonths(plan)
          if (months !== null && months >= 2) {
            return {
              label: t('paywall.planMonths', { months }),
              billing: t('paywall.billedEveryMonths', { months }),
            }
          }
          return { label: t('paywall.planCustom'), billing: t('paywall.billedRecurring') }
        }
      }
    }

    return plans.map((plan) => {
      const product = plan.pkg.product
      const { label, billing } = describe(plan)
      const pricePerMonth = computePricePerMonth({
        price: product.price,
        monthsPerCycle: plan.monthsPerCycle,
      })
      const savingsPercent =
        plan.id === savingsReference?.id
          ? null
          : computeSavingsPercent({ pricePerMonth, referencePricePerMonth })
      const showPerMonth = pricePerMonth !== null && (plan.monthsPerCycle ?? 0) > 1

      return {
        plan,
        label,
        caption: showPerMonth
          ? t('paywall.perMonth', {
              price: formatPrice({
                amount: pricePerMonth,
                currencyCode: product.currencyCode,
                locale: i18n.language,
              }),
            })
          : billing,
        savingsBadge: savingsPercent
          ? t('paywall.savingsBadge', { percent: savingsPercent })
          : null,
        trialBadge: plan.hasTrial
          ? plan.trialDays
            ? t('paywall.trialBadge', { days: plan.trialDays })
            : t('paywall.trialBadgeNoDays')
          : null,
      }
    })
  }, [plans, t])

  const ctaLabel = useMemo(() => {
    if (!selectedPlan) return ''
    if (selectedPlan.hasTrial) {
      return selectedPlan.trialDays
        ? t('paywall.ctaTrial', { days: selectedPlan.trialDays })
        : t('paywall.ctaTrialNoDays')
    }
    const price = selectedPlan.pkg.product.priceString
    switch (selectedPlan.period) {
      case 'weekly':
        return t('paywall.ctaSubscribeWeekly', { price })
      case 'monthly':
        return t('paywall.ctaSubscribeMonthly', { price })
      case 'annual':
        return t('paywall.ctaSubscribeAnnual', { price })
      case 'lifetime':
        return t('paywall.ctaBuyLifetime', { price })
      default:
        return t('paywall.ctaSubscribe', { price })
    }
  }, [selectedPlan, t])

  // The price with the period it buys — a one-time purchase has none, and a cycle the store
  // reports in no nameable unit keeps the bare price.
  const selectedPrice = useMemo(() => {
    if (!selectedPlan) return null
    const price = selectedPlan.pkg.product.priceString
    switch (selectedPlan.period) {
      case 'weekly':
        return t('paywall.priceWeekly', { price })
      case 'monthly':
        return t('paywall.priceMonthly', { price })
      case 'annual':
        return t('paywall.priceAnnual', { price })
      case 'lifetime':
        return price
      default: {
        const months = wholeMonths(selectedPlan)
        return months !== null && months >= 2
          ? t('paywall.priceEveryMonths', { price, months })
          : price
      }
    }
  }, [selectedPlan, t])

  // What the store will charge and how often, stated beside the button that buys it: a surface
  // may show no plan card to carry the period, and a trial must say what it turns into. A
  // one-time purchase never "renews automatically", and a plan with no price has nothing to say.
  const legalNote = useMemo(() => {
    if (!selectedPlan || !selectedPrice) return null
    if (selectedPlan.period === 'lifetime') {
      return t('paywall.legalNoteOneTime', { price: selectedPrice })
    }
    if (selectedPlan.hasTrial) {
      return selectedPlan.trialDays
        ? t('paywall.legalNoteTrial', { days: selectedPlan.trialDays, price: selectedPrice })
        : t('paywall.legalNoteTrialNoDays', { price: selectedPrice })
    }
    return t('paywall.legalNoteRecurring', { price: selectedPrice })
  }, [selectedPlan, selectedPrice, t])

  const selectPlan = useCallback(
    (plan: OfferingPlan) => {
      setSelectedPlanId(plan.id)
      analyticsService.track('paywall_plan_selected', {
        plan: plan.period,
        product_id: plan.pkg.product.identifier,
        source,
        surface,
      })
    },
    [source, surface]
  )

  const purchaseSelected = useCallback(async () => {
    if (!selectedPlan) return
    await purchasePlan({ plan: selectedPlan, source, surface })
  }, [purchasePlan, selectedPlan, source, surface])

  return {
    options,
    selectedPlan,
    selectPlan,
    selectedPrice,
    ctaLabel,
    legalNote,
    hasPrices,
    isLoadingPurchase,
    purchaseSelected,
  }
}
