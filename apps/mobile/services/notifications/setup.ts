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

export interface NotificationPermission {
  isGranted: boolean
  // False once the OS shows no dialog any more: the request then resolves at once, and the system
  // settings are the only way left to grant it.
  canAskAgain: boolean
}

const toPermission = ({
  status,
  canAskAgain,
}: Notifications.NotificationPermissionsStatus): NotificationPermission => ({
  isGranted: status === 'granted',
  canAskAgain,
})

export const notificationService = {
  async readPermission(): Promise<NotificationPermission> {
    return toPermission(await Notifications.getPermissionsAsync())
  },

  // Only from the screen that shows what the permission is for — never at launch, and never from a
  // scheduling path, which runs as the app is left.
  async requestPermission(): Promise<NotificationPermission> {
    const current = await notificationService.readPermission()
    if (current.isGranted) return current
    return toPermission(await Notifications.requestPermissionsAsync())
  },
}
