interface AlertNotificationBase {
  alertId: string
  fromCurrency: string
  toCurrency: string
  currentRate: number
}

export interface ThresholdAlertNotificationData extends AlertNotificationBase {
  triggerType: 'threshold'
  direction: 'above' | 'below'
  targetRate: number
}

export interface VariationAlertNotificationData extends AlertNotificationBase {
  triggerType: 'variation'
  variationPercent: number
  baselineRate: number
}

export type AlertNotificationData = ThresholdAlertNotificationData | VariationAlertNotificationData

type DataLike = Record<string, unknown> | null | undefined

export function parseAlertPayload(data: DataLike): AlertNotificationData | null {
  if (!data || data.type !== 'rate_alert') return null

  const { alertId, fromCurrency, toCurrency, currentRate } = data
  if (
    typeof alertId !== 'string' ||
    typeof fromCurrency !== 'string' ||
    typeof toCurrency !== 'string'
  ) {
    return null
  }

  const parsedCurrent = Number(currentRate)
  if (!Number.isFinite(parsedCurrent)) return null

  const base = { alertId, fromCurrency, toCurrency, currentRate: parsedCurrent }

  if (data.triggerType === 'variation') {
    const variationPercent = Number(data.variationPercent)
    const baselineRate = Number(data.baselineRate)
    if (!Number.isFinite(variationPercent) || !Number.isFinite(baselineRate)) return null
    return { ...base, triggerType: 'variation', variationPercent, baselineRate }
  }

  const direction = data.direction
  const targetRate = Number(data.targetRate)
  if (direction !== 'above' && direction !== 'below') return null
  if (!Number.isFinite(targetRate)) return null
  return { ...base, triggerType: 'threshold', direction, targetRate }
}
