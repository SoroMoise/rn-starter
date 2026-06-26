import { mmkv } from '../mmkv'
import { KEYS } from '../keys'

export const widgetStorage = {
  setPostPurchaseCardShown(): void {
    mmkv.set(KEYS.WIDGET_POST_PURCHASE_CARD_SHOWN, true)
  },
  hasPostPurchaseCardBeenShown(): boolean {
    return mmkv.getBoolean(KEYS.WIDGET_POST_PURCHASE_CARD_SHOWN) ?? false
  },
  setPostPurchaseCardPending(): void {
    mmkv.set(KEYS.WIDGET_POST_PURCHASE_CARD_PENDING, true)
  },
  isPostPurchaseCardPending(): boolean {
    return mmkv.getBoolean(KEYS.WIDGET_POST_PURCHASE_CARD_PENDING) ?? false
  },
  clearPostPurchaseCardPending(): void {
    mmkv.delete(KEYS.WIDGET_POST_PURCHASE_CARD_PENDING)
  },
  setTooltipShown(): void {
    mmkv.set(KEYS.WIDGET_TOOLTIP_SHOWN, true)
  },
  hasTooltipBeenShown(): boolean {
    return mmkv.getBoolean(KEYS.WIDGET_TOOLTIP_SHOWN) ?? false
  },
  setLastKnownAddedState(added: boolean): void {
    mmkv.set(KEYS.WIDGET_LAST_KNOWN_ADDED_STATE, added)
  },
  getLastKnownAddedState(): boolean {
    return mmkv.getBoolean(KEYS.WIDGET_LAST_KNOWN_ADDED_STATE) ?? false
  },
}
