import { useAlertsStore } from '@/stores/alertsStore'
import type { RateAlert } from '@/types'
import { useMemo } from 'react'
import { useShallow } from 'zustand/shallow'

export interface PairGroup {
  from: string
  to: string
  items: RateAlert[]
}

export function useAlertsHubData() {
  const alerts = useAlertsStore(useShallow((s) => s.alerts))

  const { activeAlerts, triggeredAlerts } = useMemo(() => {
    const active: RateAlert[] = []
    const triggered: RateAlert[] = []
    for (const alert of alerts) {
      if (alert.isActive) active.push(alert)
      else triggered.push(alert)
    }
    triggered.sort((a, b) => {
      const aT = a.triggeredAt ?? a.createdAt
      const bT = b.triggeredAt ?? b.createdAt
      return bT.localeCompare(aT)
    })
    return { activeAlerts: active, triggeredAlerts: triggered }
  }, [alerts])

  const activeGroups = useMemo<PairGroup[]>(() => {
    const map = new Map<string, PairGroup>()
    for (const alert of activeAlerts) {
      const key = `${alert.fromCurrency}|${alert.toCurrency}`
      const existing = map.get(key)
      if (existing) {
        existing.items.push(alert)
      } else {
        map.set(key, { from: alert.fromCurrency, to: alert.toCurrency, items: [alert] })
      }
    }
    return Array.from(map.values()).sort((a, b) => b.items.length - a.items.length)
  }, [activeAlerts])

  return { alerts, activeAlerts, triggeredAlerts, activeGroups }
}
