import { REVIEW_REQUEST_CONFIG, STRONG_RATING_MOMENTS, type RatingMoment } from '@/constants/rating'

const DAY_MS = 24 * 60 * 60 * 1000

export type ReviewRequestState = {
  moment: RatingMoment
  optedOut: boolean
  requestCount: number
  lastRequestAt: number
  daysSinceInstall: number
  sessionCount: number
  totalActions: number
  lastAdShownAt: number
  canPresentAutoPromo: boolean
  now: number
}

export type ReviewSuppressionReason =
  | 'opted_out'
  | 'request_cap'
  | 'cooldown'
  | 'too_new'
  | 'not_enough_sessions'
  | 'not_enough_actions'
  | 'weak_moment'
  | 'ad_collision'
  | 'promo_collision'

export type ReviewRequestDecision =
  | { show: true; requestIndex: number }
  | { show: false; reason: ReviewSuppressionReason }

export function evaluateReviewRequest(state: ReviewRequestState): ReviewRequestDecision {
  const c = REVIEW_REQUEST_CONFIG

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

  return { show: true, requestIndex: requestsInStreak + 1 }
}
