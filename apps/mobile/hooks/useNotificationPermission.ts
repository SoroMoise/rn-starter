import { notificationService, type NotificationPermission } from '@/services/notifications'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'

// The grant changes outside the app — in the system settings, or a dialog drawn over it — so it is
// read again every time the app comes back, rather than trusted from the mount.
export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null)
  // A reading started before a request can land after its answer; only the latest one is kept.
  const latestReading = useRef(0)

  const read = useCallback(async (source: () => Promise<NotificationPermission>) => {
    const reading = ++latestReading.current
    const next = await source()
    if (reading === latestReading.current) setPermission(next)
    return next
  }, [])

  const refresh = useCallback(() => {
    // A failed reading keeps the last one: the next foreground reads again.
    read(notificationService.readPermission).catch(() => undefined)
  }, [read])

  const request = useCallback(() => read(notificationService.requestPermission), [read])

  useEffect(() => {
    refresh()

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh()
    })

    return () => subscription.remove()
  }, [refresh])

  return { permission, request }
}
