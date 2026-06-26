import { ONBOARDING_MOCK_RATES_BASE_USD } from '@/constants/onboardingMockRates'

const FALLBACK_POOL = ['USD', 'EUR', 'JPY', 'GBP', 'CHF', 'CAD'] as const

export function mockConvert({
  amount,
  from,
  to,
}: {
  amount: number
  from: string
  to: string
}): number {
  if (from === to) return amount
  const fromRate = ONBOARDING_MOCK_RATES_BASE_USD[from]
  const toRate = ONBOARDING_MOCK_RATES_BASE_USD[to]
  if (!fromRate || !toRate) return amount
  const amountInUsd = amount / fromRate
  return amountInUsd * toRate
}

export function pickAhaTargets(source: string, defaults: readonly string[]): string[] {
  const seen = new Set<string>()
  const targets: string[] = []
  for (const code of defaults) {
    if (code !== source && !seen.has(code)) {
      seen.add(code)
      targets.push(code)
    }
  }
  for (const code of FALLBACK_POOL) {
    if (targets.length === 3) break
    if (code !== source && !seen.has(code)) {
      seen.add(code)
      targets.push(code)
    }
  }
  return targets.slice(0, 3)
}
