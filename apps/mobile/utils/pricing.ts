const MIN_DISPLAYABLE_SAVINGS_PCT = 20

export function computeSavingsPercent({
  monthlyPrice,
  annualPrice,
}: {
  monthlyPrice: number | undefined
  annualPrice: number | undefined
}): number | null {
  if (!monthlyPrice || !annualPrice) return null
  const annualizedMonthly = monthlyPrice * 12
  if (annualizedMonthly <= 0) return null
  const savings = ((annualizedMonthly - annualPrice) / annualizedMonthly) * 100
  // Regional pricing can make the yearly plan barely cheaper (or pricier):
  // a "-3%" or negative badge hurts the offer more than no badge at all.
  if (savings < MIN_DISPLAYABLE_SAVINGS_PCT) return null
  return Math.round(savings)
}

export function computeMonthlyFromAnnual({ annualPrice }: { annualPrice: number }): number {
  return annualPrice / 12
}

export function formatMonthlyPrice({
  annualPrice,
  currencyCode,
  locale,
}: {
  annualPrice: number
  currencyCode: string
  locale: string
}): string {
  const monthly = computeMonthlyFromAnnual({ annualPrice })
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode }).format(
      monthly
    )
  } catch {
    return monthly.toFixed(2)
  }
}
