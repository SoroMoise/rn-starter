export type PromoSurface = 'paywall' | 'interstitial_ad'

const visibleSurfaces = new Set<PromoSurface>()
let autoPromoShownThisSession = false

function setSurfaceVisible({ surface, visible }: { surface: PromoSurface; visible: boolean }) {
  if (visible) visibleSurfaces.add(surface)
  else visibleSurfaces.delete(surface)
}

// Single in-memory authority over interruptive surfaces — the paywall and the AdMob
// interstitial. It keeps them from stacking, and grants one automatic interruption per
// session, all types included: an ad and a promo never land in the same session. A paywall
// the user opens registers its visibility, so nothing automatic lands on top of it, but does
// not spend the budget.
export const promoCoordinator = {
  setPaywallVisible(visible: boolean): void {
    setSurfaceVisible({ surface: 'paywall', visible })
  },

  setInterstitialVisible(visible: boolean): void {
    setSurfaceVisible({ surface: 'interstitial_ad', visible })
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
