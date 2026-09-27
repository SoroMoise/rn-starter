import { useCanServeAd } from '@/hooks/useCanServeAd'
import { useAdFree } from '@/providers/AdFreeProvider'

// The banner renders from this answer and its screen reserves room from the same one — a
// second, hand-written condition is how a screen ends up padding for a banner nobody sees.
export function useAdPlacementActive({
  unitId,
  enabled = true,
}: {
  unitId: string | null
  enabled?: boolean
}): boolean {
  const canServe = useCanServeAd({ unitId, enabled })
  const { isAdFreeActive } = useAdFree()

  return canServe && !isAdFreeActive
}
