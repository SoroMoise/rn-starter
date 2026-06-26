import { mmkv } from '../mmkv'
import { KEYS } from '../keys'

export const engagementStorage = {
  getFirstAppUsage(): number | null {
    const raw = mmkv.getString(KEYS.FIRST_APP_USAGE)
    if (!raw) return null
    const n = parseInt(raw, 10)
    return Number.isFinite(n) ? n : null
  },

  setFirstAppUsage(ts: number): void {
    mmkv.set(KEYS.FIRST_APP_USAGE, ts.toString())
  },

  getInstallDate(): number | null {
    const raw = mmkv.getString(KEYS.INSTALL_DATE)
    if (!raw) return null
    const n = parseInt(raw, 10)
    return Number.isFinite(n) ? n : null
  },

  setInstallDate(ts: number): void {
    mmkv.set(KEYS.INSTALL_DATE, ts.toString())
  },

  getSessionCount(): number {
    const raw = mmkv.getString(KEYS.SESSION_COUNT)
    return raw ? parseInt(raw, 10) || 0 : 0
  },

  setSessionCount(n: number): void {
    mmkv.set(KEYS.SESSION_COUNT, n.toString())
  },

  getPaywallShownCount(): number {
    const raw = mmkv.getString(KEYS.PAYWALL_SHOWN_COUNT)
    return raw ? parseInt(raw, 10) || 0 : 0
  },

  setPaywallShownCount(n: number): void {
    mmkv.set(KEYS.PAYWALL_SHOWN_COUNT, n.toString())
  },

  getLastContextualPaywallAt(): number {
    const raw = mmkv.getString(KEYS.CONTEXTUAL_PAYWALL_LAST_AT)
    return raw ? parseInt(raw, 10) || 0 : 0
  },

  setLastContextualPaywallAt(ts: number): void {
    mmkv.set(KEYS.CONTEXTUAL_PAYWALL_LAST_AT, ts.toString())
  },

  getContextualShownCount(): number {
    const raw = mmkv.getString(KEYS.CONTEXTUAL_PAYWALL_SHOWN_COUNT)
    return raw ? parseInt(raw, 10) || 0 : 0
  },

  incrementContextualShownCount(): number {
    const next = engagementStorage.getContextualShownCount() + 1
    mmkv.set(KEYS.CONTEXTUAL_PAYWALL_SHOWN_COUNT, next.toString())
    return next
  },

  getActionCount(): number {
    const raw = mmkv.getString(KEYS.ENGAGEMENT_ACTION_COUNT)
    return raw ? parseInt(raw, 10) || 0 : 0
  },

  incrementAction(): number {
    const next = engagementStorage.getActionCount() + 1
    mmkv.set(KEYS.ENGAGEMENT_ACTION_COUNT, next.toString())
    return next
  },

  resetActionCount(): void {
    mmkv.set(KEYS.ENGAGEMENT_ACTION_COUNT, '0')
  },
}
