import { useAlertsStore, type ScheduledAlert } from '@/stores/alertsStore'
import { useMemo } from 'react'
import { useShallow } from 'zustand/shallow'

export function useAlertsHubData() {
  const alerts = useAlertsStore(useShallow((s) => s.alerts))
  const now = Date.now()

  const { activeAlerts, triggeredAlerts } = useMemo(() => {
    const active: ScheduledAlert[] = []
    const triggered: ScheduledAlert[] = []
    for (const alert of alerts) {
      if (alert.isActive) active.push(alert)
      else triggered.push(alert)
    }
    // Sort triggered by most recent scheduled time first
    triggered.sort((a, b) => b.scheduledAt - a.scheduledAt)
    return { activeAlerts: active, triggeredAlerts: triggered }
  }, [alerts])

  // Pending = active and scheduled in the future
  const pendingAlerts = useMemo(
    () => activeAlerts.filter((a) => a.scheduledAt > now),
    [activeAlerts, now]
  )

  return { alerts, activeAlerts, triggeredAlerts, pendingAlerts }
}
