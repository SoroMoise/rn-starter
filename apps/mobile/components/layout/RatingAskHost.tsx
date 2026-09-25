import { RATING_ASK_MIN_AWAY_MS, RATING_ASK_SETTLE_MS } from '@/constants/rating'
import { useRatingPrompt } from '@/hooks/useRatingPrompt'
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
        // One arming, one evaluation: a refusal left armed would be traced again at every
        // return for as long as a cooldown lasts.
        reviewStorage.setArmed(false)
        void maybeAskForRating({ moment: 'action_completed' })
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
