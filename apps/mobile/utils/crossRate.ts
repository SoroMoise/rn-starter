export function calculateCrossRate({
  rates,
  from,
  to,
}: {
  rates: Record<string, number>
  from: string
  to: string
}): number | null {
  if (from === to) return 1
  if (from === 'USD') return rates[to] ?? null
  if (to === 'USD') {
    const r = rates[from]
    return r ? 1 / r : null
  }
  const f = rates[from]
  const t = rates[to]
  return f != null && t != null ? t / f : null
}
