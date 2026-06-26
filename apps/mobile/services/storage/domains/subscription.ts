import { KEYS } from '../keys'
import { mmkv } from '../mmkv'

export const subscriptionStorage = {
  getExpiresAt(): number | null {
    const raw = mmkv.getString(KEYS.SUBSCRIPTION_EXPIRES_AT)
    if (!raw) return null
    const n = parseInt(raw, 10)
    return Number.isFinite(n) ? n : null
  },

  setExpiresAt(ms: number | null): void {
    if (ms === null) {
      mmkv.delete(KEYS.SUBSCRIPTION_EXPIRES_AT)
    } else {
      mmkv.set(KEYS.SUBSCRIPTION_EXPIRES_AT, ms.toString())
    }
  },

  getIsLifetime(): boolean {
    return mmkv.getBoolean(KEYS.SUBSCRIPTION_IS_LIFETIME) ?? false
  },

  setIsLifetime(value: boolean): void {
    if (value) {
      mmkv.set(KEYS.SUBSCRIPTION_IS_LIFETIME, true)
    } else {
      mmkv.delete(KEYS.SUBSCRIPTION_IS_LIFETIME)
    }
  },

  persistFromEntitlement(args: {
    isPremiumActive: boolean
    expirationDateMillis: number | null
    isOnline: boolean
    gracePeriodMs: number
  }): void {
    if (args.isPremiumActive) {
      if (args.expirationDateMillis != null) {
        this.setExpiresAt(args.expirationDateMillis)
        this.setIsLifetime(false)
      } else {
        this.setIsLifetime(true)
      }
      return
    }
    // Keep the local expiry intact while the user is still in their grace
    // window — online or offline — so derive() can continue granting access
    // and the grace banner remains visible.
    if (args.isOnline) {
      const derived = this.derive(Date.now(), args.gracePeriodMs)
      if (!derived.isInGracePeriod) {
        this.clear()
      }
    }
  },

  derive(
    nowMs: number,
    gracePeriodMs: number
  ): { isPremium: boolean; isInGracePeriod: boolean; expiresAtMs: number | null } {
    if (this.getIsLifetime()) {
      return { isPremium: true, isInGracePeriod: false, expiresAtMs: null }
    }
    const expiresAtMs = this.getExpiresAt()
    if (expiresAtMs === null) {
      return { isPremium: false, isInGracePeriod: false, expiresAtMs: null }
    }
    if (nowMs < expiresAtMs) {
      return { isPremium: true, isInGracePeriod: false, expiresAtMs }
    }
    if (nowMs < expiresAtMs + gracePeriodMs) {
      return { isPremium: true, isInGracePeriod: true, expiresAtMs }
    }
    return { isPremium: false, isInGracePeriod: false, expiresAtMs }
  },

  clear(): void {
    this.setExpiresAt(null)
    this.setIsLifetime(false)
  },
}
