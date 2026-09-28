import { REVIEW_REQUEST_CONFIG, STRONG_RATING_MOMENTS, type RatingMoment } from '@/constants/rating'

const DAY_MS = 24 * 60 * 60 * 1000

export type ReviewRequestState = {
  moment: RatingMoment
  nativeReviewAvailable: boolean
  optedOut: boolean
  requestCount: number
  lastRequestAt: number
  daysSinceInstall: number
  sessionCount: number
  totalActions: number
  lastAdShownAt: number
  canPresentAutoPromo: boolean
  hadFriction: boolean
  isOnline: boolean
  now: number
}

export type ReviewSuppressionReason =
  | 'review_unavailable'
  | 'opted_out'
  | 'request_cap'
  | 'cooldown'
  | 'too_new'
  | 'not_enough_sessions'
  | 'not_enough_actions'
  | 'weak_moment'
  | 'ad_collision'
  | 'promo_collision'
  | 'friction'
  | 'offline'

export type ReviewRequestDecision =
  | { show: true; requestIndex: number }
  | { show: false; reason: ReviewSuppressionReason }

// A collision or a friction ends with its session, if not sooner, and a lost connection may be back
// by the next return; every other refusal holds past the session, and the next action arms a fresh
// ask anyway.
export function refusalOutlivesSession(reason: ReviewSuppressionReason): boolean {
  return (
    reason !== 'ad_collision' &&
    reason !== 'promo_collision' &&
    reason !== 'friction' &&
    reason !== 'offline'
  )
}

export function evaluateReviewRequest(state: ReviewRequestState): ReviewRequestDecision {
  const c = REVIEW_REQUEST_CONFIG

  if (!state.nativeReviewAvailable) return { show: false, reason: 'review_unavailable' }
  if (state.optedOut) return { show: false, reason: 'opted_out' }

  const sinceLastRequest = state.now - state.lastRequestAt
  const streakEnded = state.lastRequestAt > 0 && sinceLastRequest >= c.softResetDays * DAY_MS
  const requestsInStreak = streakEnded ? 0 : state.requestCount
  if (requestsInStreak >= c.requestCap) return { show: false, reason: 'request_cap' }

  const cooldownMs = c.cooldownDays * Math.pow(c.backoffMultiplier, requestsInStreak) * DAY_MS
  if (state.lastRequestAt > 0 && sinceLastRequest < cooldownMs) {
    return { show: false, reason: 'cooldown' }
  }

  if (state.daysSinceInstall < c.minDaysSinceInstall) return { show: false, reason: 'too_new' }
  if (state.sessionCount < c.minSessions) return { show: false, reason: 'not_enough_sessions' }
  if (state.totalActions < c.minActions) return { show: false, reason: 'not_enough_actions' }
  if (!STRONG_RATING_MOMENTS.includes(state.moment)) return { show: false, reason: 'weak_moment' }

  if (state.now - state.lastAdShownAt < c.adQuietSeconds * 1000) {
    return { show: false, reason: 'ad_collision' }
  }
  if (!state.canPresentAutoPromo) return { show: false, reason: 'promo_collision' }
  if (state.hadFriction) return { show: false, reason: 'friction' }
  if (!state.isOnline) return { show: false, reason: 'offline' }

  return { show: true, requestIndex: requestsInStreak + 1 }
}
