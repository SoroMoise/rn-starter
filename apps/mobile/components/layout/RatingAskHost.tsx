import { RATING_ASK_MIN_AWAY_MS, RATING_ASK_SETTLE_MS } from '@/constants/rating'
import { useRatingPrompt } from '@/hooks/useRatingPrompt'
import { refusalOutlivesSession } from '@/services/api/reviewPolicy'
import { reviewStorage } from '@/services/storage/domains/review'
import { useEffect } from 'react'
import { AppState } from 'react-native'

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
