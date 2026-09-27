import { useAdsConsent } from '@/hooks/useAdsConsent'
import { usePremium } from '@/hooks/usePremium'
import { adsAllowedInEnvironment } from '@/services/api/adEnvironment'

export function useCanServeAd({
  unitId,
  enabled = true,
}: {
  unitId: string | null
  enabled?: boolean
}): boolean {
  const { isPremium, isInitialized } = usePremium()
  const { canRequestAds } = useAdsConsent()

  return (
    enabled &&
    unitId !== null &&
    isInitialized &&
    !isPremium &&
    canRequestAds &&
    adsAllowedInEnvironment()
  )
}
