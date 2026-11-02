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

  derive(nowMs: number): boolean {
    if (this.getIsLifetime()) return true
    const expiresAtMs = this.getExpiresAt()
    return expiresAtMs !== null && nowMs < expiresAtMs
  },

  clear(): void {
    this.setExpiresAt(null)
    this.setIsLifetime(false)
  },
}
