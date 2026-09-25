import {
  PACKAGE_TYPE,
  PRODUCT_CATEGORY,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases'

export type PlanPeriod = 'weekly' | 'monthly' | 'annual' | 'lifetime' | 'other'

export type OfferingPlan = {
  id: string
  pkg: PurchasesPackage
  period: PlanPeriod
  monthsPerCycle: number | null
  hasTrial: boolean
  trialDays: number | null
}

const ISO_PERIOD = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?$/

const MONTHS_PER_WEEK = 12 / 52
const MONTHS_PER_DAY = 12 / 365
const PERIOD_TOLERANCE = 0.01

const HIGHLIGHTED_PACKAGE_KEY = 'highlightedPackage'

function monthsInPeriod(iso: string | null | undefined): number | null {
  if (!iso) return null
  const match = ISO_PERIOD.exec(iso)
  if (!match) return null
  const [, years, months, weeks, days] = match
  const total =
    Number(years ?? 0) * 12 +
    Number(months ?? 0) +
    Number(weeks ?? 0) * MONTHS_PER_WEEK +
    Number(days ?? 0) * MONTHS_PER_DAY
  return total > 0 ? total : null
}

// `productCategory` is the authority; the rest is fallback for a store that didn't report one.
function isOneTimePurchase(pkg: PurchasesPackage): boolean {
  const category = pkg.product.productCategory
  if (category === PRODUCT_CATEGORY.NON_SUBSCRIPTION) return true
  if (category === PRODUCT_CATEGORY.SUBSCRIPTION) return false
  return pkg.packageType === PACKAGE_TYPE.LIFETIME || !pkg.product.subscriptionPeriod
}

function resolvePeriod({
  monthsPerCycle,
  oneTime,
}: {
  monthsPerCycle: number | null
  oneTime: boolean
}): PlanPeriod {
  if (oneTime) return 'lifetime'
  if (monthsPerCycle === null) return 'other'
  if (Math.abs(monthsPerCycle - 12) < PERIOD_TOLERANCE) return 'annual'
  if (Math.abs(monthsPerCycle - 1) < PERIOD_TOLERANCE) return 'monthly'
  if (Math.abs(monthsPerCycle - MONTHS_PER_WEEK) < PERIOD_TOLERANCE) return 'weekly'
  return 'other'
}

const DAYS_PER_UNIT: Record<string, number> = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 }

// Only a zero intro price counts as a trial — a paid intro price is an offer.
function readFreeTrial(pkg: PurchasesPackage): { hasTrial: boolean; trialDays: number | null } {
  const intro = pkg.product.introPrice
  if (!intro || intro.price !== 0) return { hasTrial: false, trialDays: null }
  const daysPerUnit = DAYS_PER_UNIT[intro.periodUnit?.toUpperCase()]
  const days = daysPerUnit ? Math.round(daysPerUnit * intro.periodNumberOfUnits) : null
  return { hasTrial: true, trialDays: days && days > 0 ? days : null }
}

export function buildOfferingPlans(offering: PurchasesOffering | null): OfferingPlan[] {
  return (offering?.availablePackages ?? []).map((pkg) => {
    const oneTime = isOneTimePurchase(pkg)
    const monthsPerCycle = oneTime ? null : monthsInPeriod(pkg.product.subscriptionPeriod)
    return {
      id: pkg.identifier,
      pkg,
      period: resolvePeriod({ monthsPerCycle, oneTime }),
      monthsPerCycle,
      ...readFreeTrial(pkg),
    }
  })
}

export function pickDefaultPlan({
  offering,
  plans,
}: {
  offering: PurchasesOffering | null
  plans: OfferingPlan[]
}): OfferingPlan | null {
  const highlighted = offering?.metadata?.[HIGHLIGHTED_PACKAGE_KEY]
  if (typeof highlighted === 'string') {
    const match = plans.find((plan) => plan.id === highlighted)
    if (match) return match
  }

  const longestCycle = plans.reduce<OfferingPlan | null>((best, plan) => {
    if (plan.monthsPerCycle === null) return best
    if (!best || plan.monthsPerCycle > (best.monthsPerCycle ?? 0)) return plan
    return best
  }, null)

  return longestCycle ?? plans[0] ?? null
}

/** The shortest cycle in the offer — what a savings badge is measured against. */
export function findSavingsReference(plans: OfferingPlan[]): OfferingPlan | null {
  return plans.reduce<OfferingPlan | null>((best, plan) => {
    if (plan.monthsPerCycle === null) return best
    if (!best || plan.monthsPerCycle < (best.monthsPerCycle ?? Infinity)) return plan
    return best
  }, null)
}
