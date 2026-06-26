import { ensureLanguageLoaded, getActiveLanguageFromStorage } from '@/i18n/service'
import { readUserSettingsFromStorage } from '@/services/storage/domains/userSettings'
import { isQuietNow } from '@/utils/quietHours'
import { getApp } from '@react-native-firebase/app'
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging'
import { parseAlertPayload } from './payload'
import { scheduleAlertNotification } from './scheduleAlert'

setBackgroundMessageHandler(getMessaging(getApp()), async (remoteMessage) => {
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

  const lng = ensureLanguageLoaded(getActiveLanguageFromStorage())

  await scheduleAlertNotification({
    payload,
    data: (remoteMessage.data ?? {}) as Record<string, unknown>,
    decimals: settings.decimals,
    sound: settings.notificationSound,
    lng,
  })
})
