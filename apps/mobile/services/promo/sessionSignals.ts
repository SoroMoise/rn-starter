export type FrictionReason = 'purchase_failed' | 'restore_failed'

const FRICTION_TTL_MS = 10 * 60 * 1000

let reason: FrictionReason | null = null
let markedAt = 0

const isActive = (): boolean => reason !== null && Date.now() - markedAt < FRICTION_TTL_MS

export const sessionSignals = {
  markFriction(next: FrictionReason): void {
    if (isActive()) return
    reason = next
    markedAt = Date.now()
  },

  frictionReason(): FrictionReason | null {
    return isActive() ? reason : null
  },

  hadFriction(): boolean {
    return isActive()
  },
}
