import i18n, { ensureLanguageLoaded, getActiveLanguageFromStorage } from '@/i18n/service'
import { readUserSettingsFromStorage } from '@/services/storage/domains/userSettings'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

export const RATE_ALERTS_CHANNEL_ID = 'rate_alerts'

const VIBRATION_PATTERN = [0, 250, 250, 250]

interface ChannelPrefs {
  sound: boolean
  vibration: boolean
}

async function applyChannel(prefs: ChannelPrefs): Promise<void> {
  const lng = ensureLanguageLoaded(getActiveLanguageFromStorage())

  await Notifications.setNotificationChannelAsync(RATE_ALERTS_CHANNEL_ID, {
    name: i18n.t('alerts.channelName', { lng, defaultValue: 'Rate alerts' }),
    description: i18n.t('alerts.channelDescription', {
      lng,
      defaultValue: 'Notifications when your currency pairs hit your targets',
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

export async function recreateRateAlertsChannel(prefs: ChannelPrefs): Promise<void> {
  if (Platform.OS !== 'android') return

  try {
    await Notifications.deleteNotificationChannelAsync(RATE_ALERTS_CHANNEL_ID)
  } catch {}

  await applyChannel(prefs)
}
