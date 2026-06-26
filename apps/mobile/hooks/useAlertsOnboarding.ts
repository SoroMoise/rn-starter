import { KEYS } from '@/services/storage/keys'
import { mmkv } from '@/services/storage/mmkv'
import { useCallback, useState } from 'react'

export function useAlertsOnboarding() {
  const [hasSeen, setHasSeen] = useState(
    () => mmkv.getBoolean(KEYS.ALERTS_ONBOARDING_SEEN) ?? false
  )

  const markSeen = useCallback(() => {
    mmkv.set(KEYS.ALERTS_ONBOARDING_SEEN, true)
    setHasSeen(true)
  }, [])

  return { hasSeen, markSeen }
}
