import { KEYS } from '../keys'
import { secureMmkv } from '../secure'

export const subscriptionStorage = {
  getExpiresAt(): number | null {
    const raw = secureMmkv.getString(KEYS.SUBSCRIPTION_EXPIRES_AT)
    if (!raw) return null
    const n = parseInt(raw, 10)
    return Number.isFinite(n) ? n : null
  },

  setExpiresAt(ms: number | null): void {
    if (ms === null) {
      secureMmkv.delete(KEYS.SUBSCRIPTION_EXPIRES_AT)
    } else {
      secureMmkv.set(KEYS.SUBSCRIPTION_EXPIRES_AT, ms.toString())
    }
  },

  getIsLifetime(): boolean {
    return secureMmkv.getBoolean(KEYS.SUBSCRIPTION_IS_LIFETIME) ?? false
  },

  setIsLifetime(value: boolean): void {
    if (value) {
      secureMmkv.set(KEYS.SUBSCRIPTION_IS_LIFETIME, true)
    } else {
      secureMmkv.delete(KEYS.SUBSCRIPTION_IS_LIFETIME)
    }
  },

  // Only ever fed a CustomerInfo the store actually answered with, so "no active
  // entitlement" is a verified answer and clears the cache. Play's and Apple's own
  // grace and billing-retry windows are already inside `entitlements.active`.
  persistFromEntitlement(args: {
    isPremiumActive: boolean
    expirationDateMillis: number | null
  }): void {
    if (!args.isPremiumActive) {
      this.clear()
      return
    }

    if (args.expirationDateMillis != null) {
      this.setExpiresAt(args.expirationDateMillis)
      this.setIsLifetime(false)
      return
    }

    this.setIsLifetime(true)
  },

  // The offline allowance — read only when the store could not be reached at all.
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
