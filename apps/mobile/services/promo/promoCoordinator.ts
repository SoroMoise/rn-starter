export type PromoSurface = 'paywall' | 'widget_tooltip'

let paywallVisible = false
let tooltipVisible = false
let autoPromoShownThisSession = false

// Single in-memory authority that keeps interruptive promotional surfaces (the
// paywall and the widget tooltip) from stacking on top of each other or firing
// more than once per session. User-initiated paywall opens still register their
// visibility here so an automatic promo never appears over them, but they do not
// consume the per-session auto-promo budget.
export const promoCoordinator = {
  setPaywallVisible(visible: boolean): void {
    paywallVisible = visible
  },

  setTooltipVisible(visible: boolean): void {
    tooltipVisible = visible
  },

  isSurfaceVisible(): boolean {
    return paywallVisible || tooltipVisible
  },

  autoPromoShown(): boolean {
    return autoPromoShownThisSession
  },

  canPresentAutoPromo(): boolean {
    return !paywallVisible && !tooltipVisible && !autoPromoShownThisSession
  },

  markAutoPromoShown(): void {
    autoPromoShownThisSession = true
  },

  resetSession(): void {
    autoPromoShownThisSession = false
  },
}
