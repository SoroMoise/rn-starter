import * as Notifications from 'expo-notifications'

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
  canAskAgain: boolean
}

const DELIVERING_IOS_STATUSES: readonly Notifications.IosAuthorizationStatus[] = [
  Notifications.IosAuthorizationStatus.PROVISIONAL,
  Notifications.IosAuthorizationStatus.EPHEMERAL,
]

const toPermission = ({
  status,
  canAskAgain,
  ios,
}: Notifications.NotificationPermissionsStatus): NotificationPermission => ({
  isGranted:
    status === 'granted' || (ios !== undefined && DELIVERING_IOS_STATUSES.includes(ios.status)),
  canAskAgain,
})

export const notificationService = {
  async readPermission(): Promise<NotificationPermission> {
    return toPermission(await Notifications.getPermissionsAsync())
  },

  async requestPermission(): Promise<NotificationPermission> {
    const current = await notificationService.readPermission()
    if (current.isGranted) return current
    return toPermission(await Notifications.requestPermissionsAsync())
  },
}
