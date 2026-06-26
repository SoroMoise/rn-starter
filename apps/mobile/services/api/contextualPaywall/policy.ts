import { CONTEXTUAL_PAYWALL_CONFIG } from '@/constants/contextualPaywall'

const DAY_MS = 24 * 60 * 60 * 1000

export type ContextualPaywallState = {
  isPremium: boolean
  isOnboardingCompleted: boolean
  sessionCount: number
  totalConversions: number
  contextualShownCount: number
  lastContextualPaywallAt: number
  shownThisSession: boolean
  now: number
}

export type ContextualPaywallDecision = { show: true } | { show: false; reason: string }

export function evaluateContextualPaywall(
  state: ContextualPaywallState
): ContextualPaywallDecision {
  const c = CONTEXTUAL_PAYWALL_CONFIG

  if (state.isPremium) return { show: false, reason: 'premium' }
  if (!state.isOnboardingCompleted) return { show: false, reason: 'onboarding_incomplete' }
  if (state.sessionCount <= 1) return { show: false, reason: 'first_session' }
  if (state.shownThisSession) return { show: false, reason: 'already_shown_this_session' }
  if (state.contextualShownCount >= c.lifetimeCap) return { show: false, reason: 'lifetime_cap' }

  const effectiveCooldownMs =
    c.cooldownDays * Math.pow(c.backoffMultiplier, state.contextualShownCount) * DAY_MS
  if (
    state.lastContextualPaywallAt > 0 &&
    state.now - state.lastContextualPaywallAt < effectiveCooldownMs
  ) {
    return { show: false, reason: 'cooldown' }
  }

  const meetsThreshold =
    state.sessionCount >= c.minSessions || state.totalConversions >= c.minConversions
  if (!meetsThreshold) return { show: false, reason: 'below_threshold' }

  return { show: true }
}
