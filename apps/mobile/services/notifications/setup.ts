import { ensureLanguageLoaded, getActiveLanguageFromStorage } from '@/i18n/service'
import { alertsService } from '@/services/api/alertsService'
import { readUserSettingsFromStorage } from '@/services/storage/domains/userSettings'
import { KEYS } from '@/services/storage/keys'
import { mmkv } from '@/services/storage/mmkv'
import { isQuietNow } from '@/utils/quietHours'
import { getApp } from '@react-native-firebase/app'
import {
  AuthorizationStatus,
  getMessaging,
  getToken,
  hasPermission,
  onMessage,
  onTokenRefresh,
  requestPermission,
} from '@react-native-firebase/messaging'
import * as Notifications from 'expo-notifications'
import { parseAlertPayload, type AlertNotificationData } from './payload'
import { scheduleAlertNotification } from './scheduleAlert'

interface SetupParams {
  rcCustomerId: string
  // onForegroundAlert was used to show an in-app banner (AlertNotificationCard)
  // instead of a system notification. Kept in the interface for potential re-activation.
  onForegroundAlert: (data: AlertNotificationData) => void
  onTapAlert: (data: AlertNotificationData) => void
}

const messaging = getMessaging(getApp())

let tapSubscription: Notifications.Subscription | null = null
let foregroundUnsubscribe: (() => void) | null = null
let tokenRefreshUnsubscribe: (() => void) | null = null

// Notifications received while the app is in foreground are handled by onMessage below.
// The handler plays sound and shows the system banner without adding a badge.
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

async function alignExpoNotificationsPermission(): Promise<void> {
  try {
    await Notifications.requestPermissionsAsync()
  } catch {}
}

export const notificationService = {
  async requestPermission(): Promise<boolean> {
    const authStatus = await requestPermission(messaging)
    mmkv.set(KEYS.NOTIFICATION_PERMISSION_REQUESTED, true)
    const granted =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL
    if (granted) await alignExpoNotificationsPermission()
    return granted
  },

  // True when the in-app permission primer should be shown before letting the
  // user create an alert: permission isn't granted yet and we've never asked.
  async shouldShowPermissionPrimer(): Promise<boolean> {
    const authStatus = await hasPermission(messaging)
    const isGranted =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL
    const wasRequested = mmkv.getBoolean(KEYS.NOTIFICATION_PERMISSION_REQUESTED) ?? false
    return !isGranted && !wasRequested
  },

  async setup({ rcCustomerId, onTapAlert }: SetupParams): Promise<void> {
    const authStatus = await hasPermission(messaging)
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL
    if (!enabled) return

    const token = await getToken(messaging)
    const previousToken = mmkv.getString(KEYS.FCM_TOKEN)
    const registeredAt = mmkv.getString(KEYS.FCM_TOKEN_REGISTERED_AT)

    mmkv.set(KEYS.FCM_TOKEN, token)

    if (token !== previousToken || !registeredAt) {
      try {
        await alertsService.registerToken({ rcCustomerId, token })
        mmkv.set(KEYS.FCM_TOKEN_REGISTERED_AT, new Date().toISOString())
      } catch {}
    }

    tokenRefreshUnsubscribe?.()
    tokenRefreshUnsubscribe = onTokenRefresh(messaging, async (newToken) => {
      mmkv.set(KEYS.FCM_TOKEN, newToken)
      await alertsService.registerToken({ rcCustomerId, token: newToken }).catch(() => {})
    })

    foregroundUnsubscribe?.()
    foregroundUnsubscribe = onMessage(messaging, async (remoteMessage) => {
      const payload = parseAlertPayload(
        remoteMessage.data as Record<string, unknown> | undefined | null
      )
      if (!payload) return

      const settings = readUserSettingsFromStorage()
      if (!settings.notifications) return

      if (
        settings.notificationQuietHoursEnabled &&
        isQuietNow({
          now: new Date(),
          start: settings.notificationQuietHoursStart,
          end: settings.notificationQuietHoursEnd,
        })
      ) {
        return
      }

      // Previously showed an in-app banner (AlertNotificationCard) via onForegroundAlert.
      // Now uses a system notification so sound and behavior are consistent with background.
      const lng = ensureLanguageLoaded(getActiveLanguageFromStorage())
      await scheduleAlertNotification({
        payload,
        data: (remoteMessage.data ?? {}) as Record<string, unknown>,
        decimals: settings.decimals,
        sound: settings.notificationSound,
        lng,
      }).catch(() => {})
    })

    tapSubscription?.remove()
    tapSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>
      const payload = parseAlertPayload(data)
      if (payload) onTapAlert(payload)
    })

    const lastResponse = await Notifications.getLastNotificationResponseAsync()
    if (lastResponse) {
      const data = lastResponse.notification.request.content.data as Record<string, unknown>
      const payload = parseAlertPayload(data)
      if (payload) onTapAlert(payload)
    }
  },

  getToken(): string | null {
    return mmkv.getString(KEYS.FCM_TOKEN) ?? null
  },
}
