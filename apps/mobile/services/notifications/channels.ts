import i18n, { ensureLanguageLoaded, getActiveLanguageFromStorage } from '@/i18n/service'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

// `defaultChannel` in app.config.js names the same id.
export const NOTIFICATION_CHANNEL_ID = 'reminders'

const VIBRATION_PATTERN = [0, 250, 250, 250]

// Android applies only the name and description to a channel that exists — sound, vibration and
// importance are frozen at creation, and a channel deleted then re-created under the same id comes
// back with the settings it had. A channel that must sound differently needs a new id.
export async function ensureNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return

  const lng = ensureLanguageLoaded(getActiveLanguageFromStorage())

  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
    name: i18n.t('notifications.channelName', { lng, defaultValue: 'Reminders' }),
    description: i18n.t('notifications.channelDescription', {
      lng,
      defaultValue: 'Scheduled local reminders',
    }),
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: VIBRATION_PATTERN,
    enableVibrate: true,
    lightColor: '#f59e0b',
  })
}
