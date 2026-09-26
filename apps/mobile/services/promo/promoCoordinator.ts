export type PromoSurface = 'paywall' | 'interstitial_ad' | 'consent_form'

const visibleSurfaces = new Set<PromoSurface>()
let autoPromoShownThisSession = false

function setSurfaceVisible({ surface, visible }: { surface: PromoSurface; visible: boolean }) {
  if (visible) visibleSurfaces.add(surface)
  else visibleSurfaces.delete(surface)
}

export const promoCoordinator = {
  setPaywallVisible(visible: boolean): void {
    setSurfaceVisible({ surface: 'paywall', visible })
  },

  setInterstitialVisible(visible: boolean): void {
    setSurfaceVisible({ surface: 'interstitial_ad', visible })
  },

  setConsentFormVisible(visible: boolean): void {
    setSurfaceVisible({ surface: 'consent_form', visible })
  },

  isSurfaceVisible(): boolean {
    return visibleSurfaces.size > 0
  },

  autoPromoShown(): boolean {
    return autoPromoShownThisSession
  },

  canPresentAutoPromo(): boolean {
    return !promoCoordinator.isSurfaceVisible() && !autoPromoShownThisSession
  },

  markAutoPromoShown(): void {
    autoPromoShownThisSession = true
  },

  resetSession(): void {
    autoPromoShownThisSession = false
  },
}
