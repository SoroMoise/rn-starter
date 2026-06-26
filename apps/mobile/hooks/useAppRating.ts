// apps/mobile/hooks/useAppRating.ts
import { ratingStorage } from '@/services/storage/domains/rating'
import { triggerBackupSync } from '@stores/backupTrigger'
import { useCallback } from 'react'

const DAY_IN_MS = 24 * 60 * 60 * 1000

/** Minimum days since first app open before we can show the prompt at all. */
const MIN_DAYS_BEFORE_PROMPT = 2

/** Minimum number of successful conversions before we can ever show the prompt. */
const MIN_SUCCESSFUL_CONVERSIONS = 4

/** After this many dismissals (Later / Decline), we never show the prompt again. */
const NO_MORE_PROMPT_COUNT = 4

/**
 * If the user has been inactive for this many ms since the last prompt,
 * soft-reset the execution counter so they get a prompt sooner.
 */
const SOFT_RESET_INACTIVITY_MS = 30 * DAY_IN_MS

/**
 * How many successful conversions must happen SINCE the last prompt.
 * 1st prompt: after 7 conversions since install
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
  totalSuccessfulConversions: number
  hasFavorites: boolean
  lastInterstitialShownAt?: number
}

export type UseAppRatingReturn = {
  checkAndMaybeShowRating: (context: CheckRatingContext) => Promise<boolean>
  markAsRated: () => Promise<void>
  markAsDeclinedForever: () => Promise<void>
  markAsLater: (currentConversionCount: number) => Promise<void>
}

export function useAppRating(): UseAppRatingReturn {
  const checkAndMaybeShowRating = useCallback(
    async (context: CheckRatingContext): Promise<boolean> => {
      if (!context.wasSuccessful) return false

      if (context.totalSuccessfulConversions < MIN_SUCCESSFUL_CONVERSIONS) return false

      const hasRated = ratingStorage.getHasRated()
      if (hasRated) return false

      const hasDeclinedForever = ratingStorage.getDeclinedForever()
      if (hasDeclinedForever) return false

      const now = Date.now()
      const firstUsageDate = ratingStorage.getFirstUsageDate()

      if (!firstUsageDate) {
        ratingStorage.setFirstUsageDate(now)
        triggerBackupSync()
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

      if (
        promptCount > 0 &&
        lastPromptDate > 0 &&
        now - lastPromptDate >= SOFT_RESET_INACTIVITY_MS
      ) {
        promptCount = 1
        lastPromptExecution = context.totalSuccessfulConversions
        ratingStorage.setPromptCount(promptCount)
        ratingStorage.setLastPromptExecution(lastPromptExecution)
        ratingStorage.setLastPromptDate(now)
        triggerBackupSync()
      }

      if (promptCount >= NO_MORE_PROMPT_COUNT) return false

      const threshold = getThresholdByPromptCount(promptCount)
      if (threshold === null) return false

      const conversionsSinceLastPrompt = context.totalSuccessfulConversions - lastPromptExecution
      if (conversionsSinceLastPrompt < threshold) return false

      return true
    },
    []
  )

  const markAsRated = useCallback(async () => {
    ratingStorage.setHasRated(true)
    triggerBackupSync()
  }, [])

  const markAsDeclinedForever = useCallback(async () => {
    ratingStorage.setDeclinedForever(true)
    triggerBackupSync()
  }, [])

  const markAsLater = useCallback(async (currentConversionCount: number) => {
    const promptCount = ratingStorage.getPromptCount()
    const now = Date.now()
    ratingStorage.setPromptCount(promptCount + 1)
    ratingStorage.setLastPromptExecution(currentConversionCount)
    ratingStorage.setLastPromptDate(now)
    triggerBackupSync()
  }, [])

  return { checkAndMaybeShowRating, markAsRated, markAsDeclinedForever, markAsLater }
}
