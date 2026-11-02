import { crashlyticsService } from '@/services/api/crashlyticsService'
import {
  NOTIFICATION_CHANNEL_ID,
  ensureNotificationChannels,
} from '@/services/notifications/channels'
import { notificationService } from '@/services/notifications/setup'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

export interface DailyReminder {
  id: string
  hour: number
  minute: number
}

export type DailyReminderSyncOutcome = 'scheduled' | 'cleared' | 'permission_missing' | 'failed'

interface SyncParams {
  group: string
  reminders: readonly DailyReminder[]
  // Resolved by the caller, in the current language, and frozen at scheduling.
  content: { title: string; body: string }
}

async function cancelGroup(group: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync()
  await Promise.all(
    scheduled
      .filter((request) => request.content.data?.reminderGroup === group)
      .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier))
  )
}

function reportMissingPermission(group: string): void {
  crashlyticsService.log(`notifications: "${group}" reminders not scheduled, permission missing`)
  if (__DEV__) {
    console.warn(
      `[notifications] "${group}" reminders were not scheduled: the notification permission is not ` +
        'granted. Ask for it with notificationService.requestPermission() from the screen that ' +
        'shows what it is for; the scheduler never asks.'
    )
  }
}

const isValidTime = ({ hour, minute }: DailyReminder): boolean =>
  Number.isInteger(hour) &&
  hour >= 0 &&
  hour <= 23 &&
  Number.isInteger(minute) &&
  minute >= 0 &&
  minute <= 59

async function sync({ group, reminders, content }: SyncParams): Promise<DailyReminderSyncOutcome> {
  const invalid = reminders.find((reminder) => !isValidTime(reminder))
  if (invalid) {
    throw new RangeError(
      `Reminder "${invalid.id}" has no valid time: ${invalid.hour}:${invalid.minute}`
    )
  }

  await cancelGroup(group)
  if (reminders.length === 0) return 'cleared'

  const permission = await notificationService.readPermission()
  if (!permission.isGranted) {
    reportMissingPermission(group)
    return 'permission_missing'
  }

  await ensureNotificationChannels()

  await Promise.all(
    reminders.map((reminder) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: content.title,
          body: content.body,
          sound: 'default',
          data: { reminderGroup: group, reminderId: reminder.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: reminder.hour,
          minute: reminder.minute,
          ...(Platform.OS === 'android' ? { channelId: NOTIFICATION_CHANNEL_ID } : {}),
        },
      })
    )
  )
  return 'scheduled'
}

let queue: Promise<unknown> = Promise.resolve()

export function syncDailyReminders(params: SyncParams): Promise<DailyReminderSyncOutcome> {
  const run = queue
    .then(() => sync(params))
    .catch((error: unknown): DailyReminderSyncOutcome => {
      void crashlyticsService.recordError(error, {
        source: 'syncDailyReminders',
        group: params.group,
      })
      return 'failed'
    })
  queue = run
  return run
}
