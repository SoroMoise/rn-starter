import { notificationService, type NotificationPermission } from '@/services/notifications'
import { useCallback, useEffect, useState } from 'react'
import { AppState } from 'react-native'

// The grant changes outside the app — in the system settings, or a dialog drawn over it — so it is
// read again every time the app comes back, rather than trusted from the mount.
export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null)

  const refresh = useCallback(async () => {
    setPermission(await notificationService.readPermission())
  }, [])

  const request = useCallback(async () => {
    const next = await notificationService.requestPermission()
    setPermission(next)
    return next
  }, [])

  useEffect(() => {
    void refresh()

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh()
    })

    return () => subscription.remove()
  }, [refresh])

  return { permission, request }
}
