import { KEYS } from '@/services/storage/keys'
import { mmkv } from '@/services/storage/mmkv'
import * as Notifications from 'expo-notifications'

// Notifications delivered while the app is in the foreground are presented as
// system banners with sound — no badge increment. On Android, `shouldPlaySound: false`
// would also drop the heads-up banner, whatever the channel says.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
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
}
