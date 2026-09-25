import { useAdsConsent } from '@/hooks/useAdsConsent'
import { usePremium } from '@/hooks/usePremium'
import { useAdFree } from '@/providers/AdFreeProvider'
import { adsAllowedInEnvironment } from '@/services/api/adEnvironment'

// The banner renders from this answer and its screen reserves room from the same one — a
// second, hand-written condition is how a screen ends up padding for a banner nobody sees.
export function useAdPlacementActive({
  unitId,
  enabled = true,
}: {
  unitId: string | null
  enabled?: boolean
}): boolean {
  const { isAdFreeActive } = useAdFree()
  const { isPremium, isInitialized } = usePremium()
  const { canRequestAds } = useAdsConsent()

  return (
    enabled &&
    unitId !== null &&
    isInitialized &&
    !isAdFreeActive &&
    !isPremium &&
    canRequestAds &&
    adsAllowedInEnvironment()
  )
}
