export type ContextualTrigger =
  | 'after_n_conversions'
  | 'power_action'
  | 'rewarded_ad_dismissed'
  | 'session_return'

// Cadence « Équilibrée » validée.
export const CONTEXTUAL_PAYWALL_CONFIG = {
  minSessions: 3,
  minConversions: 10,
  cooldownDays: 3,
  lifetimeCap: 4,
  backoffMultiplier: 2,
} as const

export function contextualSource(trigger: ContextualTrigger): string {
  return `contextual_${trigger}`
}
