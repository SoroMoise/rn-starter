import i18n from '@/i18n/service'
import { formatRateLocalized } from '@/utils/formatters'
import * as Notifications from 'expo-notifications'
import type { AlertNotificationData } from './payload'
import { RATE_ALERTS_CHANNEL_ID } from './channels'

interface ScheduleParams {
  payload: AlertNotificationData
  data: Record<string, unknown>
  decimals: number
  sound: boolean
  lng: string
}

export async function scheduleAlertNotification({
  payload,
  data,
  decimals,
  sound,
  lng,
}: ScheduleParams): Promise<void> {
  const t = (key: string, opts?: Record<string, unknown>) => i18n.t(key, { lng, ...opts })

  const pair = `${payload.fromCurrency} → ${payload.toCurrency}`
  const currentStr = formatRateLocalized({ rate: payload.currentRate, decimals, locale: lng })

  let body: string
  if (payload.triggerType === 'threshold') {
    const rateStr = formatRateLocalized({ rate: payload.targetRate, decimals, locale: lng })
    body =
      payload.direction === 'above'
        ? t('alerts.notif.bodyAbove', { rate: rateStr, current: currentStr })
        : t('alerts.notif.bodyBelow', { rate: rateStr, current: currentStr })
  } else {
    const delta = ((payload.currentRate - payload.baselineRate) / payload.baselineRate) * 100
    body = t('alerts.notif.bodyVariation', {
      delta: delta.toFixed(2),
      baseline: formatRateLocalized({ rate: payload.baselineRate, decimals, locale: lng }),
      current: currentStr,
    })
  }

  await Notifications.scheduleNotificationAsync({
    identifier: payload.alertId,
    content: {
      title: t('alerts.notif.title', { pair }),
      body,
      data,
      sound,
    },
    trigger: { channelId: RATE_ALERTS_CHANNEL_ID },
  })
}
