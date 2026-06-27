import type { ScheduledAlert } from '@/stores/alertsStore'
import * as Notifications from 'expo-notifications'
import { ALERTS_CHANNEL_ID } from './channels'

interface ScheduleParams {
  alert: ScheduledAlert
  sound: boolean
}

export async function scheduleAlertNotification({ alert, sound }: ScheduleParams): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: alert.id,
    content: {
      title: alert.title,
      body: alert.body,
      sound,
      data: {
        type: 'reminder',
        alertId: alert.id,
        title: alert.title,
        body: alert.body,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(alert.scheduledAt),
      channelId: ALERTS_CHANNEL_ID,
    },
  })
}

export async function cancelAlertNotification(alertId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(alertId).catch(() => {})
}
