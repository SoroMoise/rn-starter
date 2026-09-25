import { RATING_ASK_MIN_AWAY_MS, RATING_ASK_SETTLE_MS } from '@/constants/rating'
import { useRatingPrompt } from '@/hooks/useRatingPrompt'
import { refusalOutlivesSession } from '@/services/api/reviewPolicy'
import { reviewStorage } from '@/services/storage/domains/review'
import { useEffect } from 'react'
import { AppState } from 'react-native'

// Raises the ask `recordAction()` armed, once the user is back. Mount it only once the session
// has started: an ask made before `resetSession()` spends a budget the reset then hands back.
export function RatingAskHost() {
  const { maybeAskForRating } = useRatingPrompt()

  useEffect(() => {
    let settleTimer: ReturnType<typeof setTimeout> | null = null
    let leftAt: number | null = null

    const cancel = () => {
      if (settleTimer) clearTimeout(settleTimer)
      settleTimer = null
    }

    const askIfArmed = () => {
      if (!reviewStorage.getArmed()) return
      cancel()
      settleTimer = setTimeout(() => {
        settleTimer = null
        if (!reviewStorage.getArmed()) return
        void maybeAskForRating({ moment: 'action_completed' }).then((decision) => {
          // A refusal left armed would be traced again at every return for as long as it lasts —
          // a cooldown runs for months — so only a collision keeps the ask for a later session.
          if (decision === null || (!decision.show && refusalOutlivesSession(decision.reason))) {
            reviewStorage.setArmed(false)
          }
        })
      }, RATING_ASK_SETTLE_MS)
    }

    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        leftAt ??= Date.now()
        cancel()
        return
      }
      const awayMs = leftAt === null ? 0 : Date.now() - leftAt
      leftAt = null
      if (awayMs >= RATING_ASK_MIN_AWAY_MS) askIfArmed()
    })

    if (AppState.currentState === 'active') askIfArmed()
    else leftAt = Date.now()

    return () => {
      subscription.remove()
      cancel()
    }
  }, [maybeAskForRating])

  return null
}
