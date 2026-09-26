import { usePremium } from '@/hooks/usePremium'
import { useMemo, useRef } from 'react'

// The store keeps everything the user chose; the free tier's limit is applied here, on read, so a
// lapsed subscription caps the list again and a renewal hands all of it back. The tier is the one
// seeded from the cached entitlement — waiting on `isInitialized` gave a free user Pro's list for
// the first frames.
export function useCappedByTier<T>({
  items,
  freeLimit,
}: {
  items: readonly T[]
  freeLimit: number
}) {
  const { isPremium } = usePremium()
  const limit = isPremium ? Number.POSITIVE_INFINITY : freeLimit

  // Same identity while the capped items are the same, so an item added past the cap does not
  // re-run every effect that consumes the list.
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
