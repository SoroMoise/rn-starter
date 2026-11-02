import type { PurchaseOrigin } from '@/constants/purchases'
import { usePremium } from '@/hooks/usePremium'
import i18n from '@/i18n/service'
import { analyticsService } from '@/services/api/analyticsService'
import { findSavingsReference, type OfferingPlan } from '@/utils/offerings'
import { computePricePerMonth, computeSavingsPercent, formatPrice } from '@/utils/pricing'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'

export type PaywallPlanOption = {
  plan: OfferingPlan
  label: string
  caption: string
  savingsBadge: string | null
  trialBadge: string | null
}

const WHOLE_MONTH_TOLERANCE = 0.01

function wholeMonths(plan: OfferingPlan): number | null {
  const months = plan.monthsPerCycle
  if (months === null) return null
  const rounded = Math.round(months)
  return Math.abs(months - rounded) < WHOLE_MONTH_TOLERANCE ? rounded : null
}

const NO_SELECTION = { ctaLabel: '', selectedPrice: null, legalNote: null }

export function planCtaLabel({ plan, t }: { plan: OfferingPlan; t: TFunction }): string {
  if (plan.hasTrial) {
    return plan.trialDays
      ? t('paywall.ctaTrial', { days: plan.trialDays })
      : t('paywall.ctaTrialNoDays')
  }
  const price = plan.pkg.product.priceString
  switch (plan.period) {
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
}

function planPrice({ plan, t }: { plan: OfferingPlan; t: TFunction }): string {
  const price = plan.pkg.product.priceString
  switch (plan.period) {
    case 'weekly':
      return t('paywall.priceWeekly', { price })
    case 'monthly':
      return t('paywall.priceMonthly', { price })
    case 'annual':
      return t('paywall.priceAnnual', { price })
    case 'lifetime':
      return price
    default: {
      const months = wholeMonths(plan)
      return months !== null && months >= 2
        ? t('paywall.priceEveryMonths', { price, months })
        : price
    }
  }
}

export function planLegalNote({ plan, t }: { plan: OfferingPlan; t: TFunction }): string {
  const price = planPrice({ plan, t })
  if (plan.period === 'lifetime') return t('paywall.legalNoteOneTime', { price })
  if (plan.hasTrial) {
    return plan.trialDays
      ? t('paywall.legalNoteTrial', { days: plan.trialDays, price })
      : t('paywall.legalNoteTrialNoDays', { price })
  }
  return t('paywall.legalNoteRecurring', { price })
}

export function usePaywallPlans({ source, surface }: PurchaseOrigin) {
  const { t } = useTranslation()
  const { plans, defaultPlan, lifetimeOffer, hasPrices, isLoadingPurchase, purchasePlan } =
    usePremium()

  const listedPlans = useMemo(
    () => (lifetimeOffer ? plans.filter((plan) => plan.id !== lifetimeOffer.id) : plans),
    [plans, lifetimeOffer]
  )

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

  const defaultPlanId = defaultPlan?.id ?? null
  useEffect(() => {
    setSelectedPlanId(defaultPlanId)
  }, [defaultPlanId])

  const selectedPlan = useMemo(
    () => listedPlans.find((plan) => plan.id === selectedPlanId) ?? defaultPlan,
    [listedPlans, selectedPlanId, defaultPlan]
  )

  const options = useMemo<PaywallPlanOption[]>(() => {
    const savingsReference = findSavingsReference(listedPlans)
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

    return listedPlans.map((plan) => {
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
  }, [listedPlans, t])

  const { ctaLabel, selectedPrice, legalNote } = useMemo(
    () =>
      selectedPlan
        ? {
            ctaLabel: planCtaLabel({ plan: selectedPlan, t }),
            selectedPrice: planPrice({ plan: selectedPlan, t }),
            legalNote: planLegalNote({ plan: selectedPlan, t }),
          }
        : NO_SELECTION,
    [selectedPlan, t]
  )

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
