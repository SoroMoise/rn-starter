import i18n, { ensureLanguageLoaded, getActiveLanguageFromStorage } from '@/i18n/service'
import { readUserSettingsFromStorage } from '@/services/storage/domains/userSettings'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

export const NOTIFICATION_CHANNEL_ID = 'reminders'

const VIBRATION_PATTERN = [0, 250, 250, 250]

interface ChannelPrefs {
  sound: boolean
  vibration: boolean
}

async function applyChannel(prefs: ChannelPrefs): Promise<void> {
  const lng = ensureLanguageLoaded(getActiveLanguageFromStorage())

  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
    name: i18n.t('notifications.channelName', { lng, defaultValue: 'Reminders' }),
    description: i18n.t('notifications.channelDescription', {
      lng,
      defaultValue: 'Scheduled local reminders',
    }),
    importance: Notifications.AndroidImportance.HIGH,
    sound: prefs.sound ? 'default' : null,
    vibrationPattern: prefs.vibration ? VIBRATION_PATTERN : null,
    enableVibrate: prefs.vibration,
    lightColor: '#f59e0b',
  })
}

export async function ensureNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return

  const settings = readUserSettingsFromStorage()
  await applyChannel({
    sound: settings.notificationSound,
    vibration: settings.notificationVibration,
  })
}
