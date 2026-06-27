import { readUserSettingsFromStorage } from '@/services/storage/domains/userSettings'
import { KEYS } from '@/services/storage/keys'
import { mmkv } from '@/services/storage/mmkv'
import * as Notifications from 'expo-notifications'
import { parseAlertPayload, type AlertNotificationData } from './payload'

interface SetupParams {
  onTapAlert: (data: AlertNotificationData) => void
}

let tapSubscription: Notifications.Subscription | null = null

// Notifications delivered while the app is in the foreground are presented as
// system banners with optional sound — no badge increment.
Notifications.setNotificationHandler({
  handleNotification: async () => {
    const { notificationSound } = readUserSettingsFromStorage()
    return {
      shouldShowAlert: true,
      shouldPlaySound: notificationSound,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }
  },
})

export const notificationService = {
  async requestPermission(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync()
    mmkv.set(KEYS.NOTIFICATION_PERMISSION_REQUESTED, true)
    return status === 'granted'
  },

  async shouldShowPermissionPrimer(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync()
    const wasRequested = mmkv.getBoolean(KEYS.NOTIFICATION_PERMISSION_REQUESTED) ?? false
    return status !== 'granted' && !wasRequested
  },

  setup({ onTapAlert }: SetupParams): void {
    tapSubscription?.remove()
    tapSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>
      const payload = parseAlertPayload(data)
      if (payload) onTapAlert(payload)
    })

    void Notifications.getLastNotificationResponseAsync().then((lastResponse) => {
      if (!lastResponse) return
      const data = lastResponse.notification.request.content.data as Record<string, unknown>
      const payload = parseAlertPayload(data)
      if (payload) onTapAlert(payload)
    })
  },
}
