import { useAdFree } from '@/providers/AdFreeProvider'
import { useEffect, useState } from 'react'

const ONE_MINUTE_MS = 60 * 1000

export function useAdFreeRemainingMinutes(): number {
  const { adFreeUntil } = useAdFree()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (adFreeUntil === null) return
    const tick = () => setNow(Date.now())
    tick()
    const interval = setInterval(tick, ONE_MINUTE_MS)
    return () => clearInterval(interval)
  }, [adFreeUntil])

  if (adFreeUntil === null) return 0
  const remainingMs = adFreeUntil - now
  if (remainingMs <= 0) return 0
  return Math.floor(remainingMs / ONE_MINUTE_MS)
}
