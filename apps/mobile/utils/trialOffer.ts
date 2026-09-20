import type { PurchasesPackage } from 'react-native-purchases'

const DAYS_PER_UNIT: Record<string, number> = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 }

/**
 * A free trial is only a trial when the intro price is zero — a paid intro price
 * is an offer, and selling it as "free" is a false commercial claim in the app.
 * The length is read off the product; never assume one.
 */
export function getFreeTrialDays(pkg: PurchasesPackage | null): number | null {
  const intro = pkg?.product.introPrice
  if (!intro || intro.price > 0) return null

  const days = (DAYS_PER_UNIT[intro.periodUnit?.toUpperCase()] ?? 0) * intro.periodNumberOfUnits
  return days > 0 ? days : null
}
