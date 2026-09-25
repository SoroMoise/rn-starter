const MIN_DISPLAYABLE_SAVINGS_PCT = 20

export function computePricePerMonth({
  price,
  monthsPerCycle,
}: {
  price: number | undefined
  monthsPerCycle: number | null
}): number | null {
  if (!price || !monthsPerCycle || monthsPerCycle <= 0) return null
  return price / monthsPerCycle
}

export function computeSavingsPercent({
  pricePerMonth,
  referencePricePerMonth,
}: {
  pricePerMonth: number | null
  referencePricePerMonth: number | null
}): number | null {
  if (!pricePerMonth || !referencePricePerMonth || referencePricePerMonth <= 0) return null
  const savings = ((referencePricePerMonth - pricePerMonth) / referencePricePerMonth) * 100
  // Regional pricing can make the longer plan barely cheaper (or pricier):
  // a "-3%" or negative badge hurts the offer more than no badge at all.
  if (savings < MIN_DISPLAYABLE_SAVINGS_PCT) return null
  return Math.round(savings)
}

export function formatPrice({
  amount,
  currencyCode,
  locale,
}: {
  amount: number
  currencyCode: string
  locale: string
}): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode }).format(
      amount
    )
  } catch {
    return amount.toFixed(2)
  }
}
