import { usePremium } from '@/hooks/usePremium'
import { useMemo, useRef } from 'react'

export function useCappedByTier<T>({
  items,
  freeLimit,
}: {
  items: readonly T[]
  freeLimit: number
}) {
  const { isPremium } = usePremium()
  const limit = isPremium ? Number.POSITIVE_INFINITY : freeLimit

  const cappedRef = useRef<readonly T[]>(items)
  const capped = useMemo(() => {
    const next = items.length > limit ? items.slice(0, limit) : items
    const previous = cappedRef.current
    const isUnchanged =
      previous.length === next.length && previous.every((item, index) => item === next[index])

    if (!isUnchanged) cappedRef.current = next

    return cappedRef.current
  }, [items, limit])

  return {
    items: capped,
    allItems: items,
    limit,
    isCapped: !isPremium,
    canAdd: items.length < limit,
  }
}
