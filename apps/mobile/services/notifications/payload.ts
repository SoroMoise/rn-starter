export interface AlertNotificationData {
  alertId: string
  title: string
  body: string
}

type DataLike = Record<string, unknown> | null | undefined

export function parseAlertPayload(data: DataLike): AlertNotificationData | null {
  if (!data || data.type !== 'reminder') return null

  const { alertId, title, body } = data
  if (
    typeof alertId !== 'string' ||
    typeof title !== 'string' ||
    typeof body !== 'string'
  ) {
    return null
  }

  return { alertId, title, body }
}
