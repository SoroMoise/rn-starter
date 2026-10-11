import { AD_BANNER_RESERVED_HEIGHT } from '@/constants/admob'
import { useAdBannerStore } from '@/stores/adBannerStore'

export function useAdBannerReserve({ isBannerVisible }: { isBannerVisible: boolean }): number {
  const bannerHeight = useAdBannerStore((s) => s.bannerHeight)

  if (!isBannerVisible) return 0
  return bannerHeight ?? AD_BANNER_RESERVED_HEIGHT
}
