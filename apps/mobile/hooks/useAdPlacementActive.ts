import { useCanServeAd } from '@/hooks/useCanServeAd'
import { useAdFree } from '@/providers/AdFreeProvider'

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
