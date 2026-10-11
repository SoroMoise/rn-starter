import type { PaywallSource } from '@/constants/purchases'

export type ContextualTrigger = 'after_n_actions' | 'power_action' | 'rewarded_ad_dismissed'

export const CONTEXTUAL_PAYWALL_CONFIG = {
  minActions: 10,
  cooldownDays: 3,
  lifetimeCap: 4,
  backoffMultiplier: 2,
} as const

export function contextualSource(trigger: ContextualTrigger): PaywallSource {
  return `contextual_${trigger}`
}
