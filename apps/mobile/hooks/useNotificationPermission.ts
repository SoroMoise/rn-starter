import { notificationService, type NotificationPermission } from '@/services/notifications'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'

export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null)
  const latestReading = useRef(0)

  const read = useCallback(async (source: () => Promise<NotificationPermission>) => {
    const reading = ++latestReading.current
    const next = await source()
    if (reading === latestReading.current) setPermission(next)
    return next
  }, [])

  const refresh = useCallback(() => {
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
