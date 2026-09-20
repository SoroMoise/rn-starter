// apps/mobile/hooks/useAppRating.ts
import { ratingStorage } from '@/services/storage/domains/rating'
import { useCallback } from 'react'

const DAY_IN_MS = 24 * 60 * 60 * 1000

/** Minimum days since first app open before we can show the prompt at all. */
const MIN_DAYS_BEFORE_PROMPT = 2

/** Minimum number of successful actions before we can ever show the prompt. */
const MIN_SUCCESSFUL_ACTIONS = 4

/** After this many dismissals (Later / Decline), we never show the prompt again. */
const NO_MORE_PROMPT_COUNT = 4

/** Minimum days between two attempts, whatever the action counters say. */
const MIN_DAYS_BETWEEN_PROMPTS = 45

/**
 * If the user has been inactive for this many ms since the last prompt,
 * soft-reset the execution counter so they get a prompt sooner.
 *
 * MUST stay above `MIN_DAYS_BETWEEN_PROMPTS`: below it, every re-ask would land
 * past the reset and rewind the counter, so `NO_MORE_PROMPT_COUNT` would never
 * be reached and the prompt would return forever.
 */
const SOFT_RESET_INACTIVITY_MS = 180 * DAY_IN_MS

/**
 * How many successful actions must happen SINCE the last prompt.
 * 1st prompt: after 7 actions since install
 * 2nd prompt: after 5 more  (user clicked "Later")
 * 3rd prompt: after 10 more
 * 4th prompt: after 20 more  (last chance)
 */
const FIRST_PROMPT_THRESHOLD = 7
const SECOND_PROMPT_THRESHOLD = 5
const THIRD_PROMPT_THRESHOLD = 10
const FOURTH_PROMPT_THRESHOLD = 20

/** 2-minute window after an interstitial ad to avoid UX stacking. */
const INTERSTITIAL_COLLISION_WINDOW_MS = 2 * 60 * 1000

function getThresholdByPromptCount(promptCount: number): number | null {
  if (promptCount === 0) return FIRST_PROMPT_THRESHOLD
  if (promptCount === 1) return SECOND_PROMPT_THRESHOLD
  if (promptCount === 2) return THIRD_PROMPT_THRESHOLD
  if (promptCount === 3) return FOURTH_PROMPT_THRESHOLD
  return null
}

export type CheckRatingContext = {
  wasSuccessful: boolean
  totalActions: number
  lastInterstitialShownAt?: number
}

export type UseAppRatingReturn = {
  checkAndMaybeShowRating: (context: CheckRatingContext) => Promise<boolean>
  markReviewFlowLaunched: (currentActionCount: number) => Promise<void>
  markAsDeclinedForever: () => Promise<void>
  markAsLater: (currentActionCount: number) => Promise<void>
}

export function useAppRating(): UseAppRatingReturn {
  const checkAndMaybeShowRating = useCallback(
    async (context: CheckRatingContext): Promise<boolean> => {
      if (!context.wasSuccessful) return false

      if (context.totalActions < MIN_SUCCESSFUL_ACTIONS) return false

      // Legacy read-only gate: nothing sets it any more, but installs and
      // restored backups predating the split still carry it and must stay quiet.
      const hasRated = ratingStorage.getHasRated()
      if (hasRated) return false

      const hasDeclinedForever = ratingStorage.getDeclinedForever()
      if (hasDeclinedForever) return false

      const now = Date.now()
      const firstUsageDate = ratingStorage.getFirstUsageDate()

      if (!firstUsageDate) {
        ratingStorage.setFirstUsageDate(now)
        return false
      }

      if (now - firstUsageDate < MIN_DAYS_BEFORE_PROMPT * DAY_IN_MS) return false

      if (
        context.lastInterstitialShownAt &&
        now - context.lastInterstitialShownAt < INTERSTITIAL_COLLISION_WINDOW_MS
      ) {
        return false
      }

      let promptCount = ratingStorage.getPromptCount()
      let lastPromptExecution = ratingStorage.getLastPromptExecution()
      const lastPromptDate = ratingStorage.getLastPromptDate()

      if (lastPromptDate > 0 && now - lastPromptDate < MIN_DAYS_BETWEEN_PROMPTS * DAY_IN_MS) {
        return false
      }

      if (
        promptCount > 0 &&
        lastPromptDate > 0 &&
        now - lastPromptDate >= SOFT_RESET_INACTIVITY_MS
      ) {
        promptCount = 1
        lastPromptExecution = context.totalActions
        ratingStorage.setPromptCount(promptCount)
        ratingStorage.setLastPromptExecution(lastPromptExecution)
        ratingStorage.setLastPromptDate(now)
      }

      if (promptCount >= NO_MORE_PROMPT_COUNT) return false

      const threshold = getThresholdByPromptCount(promptCount)
      if (threshold === null) return false

      const actionsSinceLastPrompt = context.totalActions - lastPromptExecution
      if (actionsSinceLastPrompt < threshold) return false

      return true
    },
    []
  )

  /**
   * Records an ATTEMPT, never a conclusion. Play's API reports neither whether
   * the card appeared nor its outcome, so a call swallowed by the quota must
   * stay retryable later — which is why this does not set `hasRated`.
   */
  const markReviewFlowLaunched = useCallback(async (currentActionCount: number) => {
    const promptCount = ratingStorage.getPromptCount()
    ratingStorage.setPromptCount(promptCount + 1)
    ratingStorage.setLastPromptExecution(currentActionCount)
    ratingStorage.setLastPromptDate(Date.now())
  }, [])

  const markAsDeclinedForever = useCallback(async () => {
    ratingStorage.setDeclinedForever(true)
  }, [])

  const markAsLater = useCallback(async (currentActionCount: number) => {
    const promptCount = ratingStorage.getPromptCount()
    const now = Date.now()
    ratingStorage.setPromptCount(promptCount + 1)
    ratingStorage.setLastPromptExecution(currentActionCount)
    ratingStorage.setLastPromptDate(now)
  }, [])

  return { checkAndMaybeShowRating, markReviewFlowLaunched, markAsDeclinedForever, markAsLater }
}
