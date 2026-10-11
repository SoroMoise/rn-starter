import { create } from 'zustand'

interface AdBannerStore {
  bannerHeight: number | null
  reportBannerHeight: (height: number) => void
}

export const useAdBannerStore = create<AdBannerStore>()((set) => ({
  bannerHeight: null,
  reportBannerHeight: (height) => {
    if (height > 0) set({ bannerHeight: Math.ceil(height) })
  },
}))
