import { mmkvStateStorage } from '@/services/storage/adapter'
import { KEYS } from '@/services/storage/keys'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface ScheduledAlert {
  id: string
  title: string
  body: string
  scheduledAt: number // unix ms — when the local notification fires
  isActive: boolean
}

interface AlertsStore {
  alerts: ScheduledAlert[]
  add: (params: Omit<ScheduledAlert, 'id'>) => ScheduledAlert
  remove: (id: string) => void
  toggle: (id: string) => void
  list: () => ScheduledAlert[]
  /** @deprecated No-op kept for layout compatibility during migration. */
  fetchAlerts: () => Promise<void>
}

let idCounter = 0

function generateId(): string {
  return `alert-${Date.now()}-${++idCounter}`
}

export const useAlertsStore = create<AlertsStore>()(
  persist(
    (set, get) => ({
      alerts: [],

      add: (params) => {
        const alert: ScheduledAlert = { id: generateId(), ...params }
        set({ alerts: [...get().alerts, alert] })
        return alert
      },

      remove: (id) => {
        set({ alerts: get().alerts.filter((a) => a.id !== id) })
      },

      toggle: (id) => {
        set({
          alerts: get().alerts.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a)),
        })
      },

      list: () => get().alerts,

      fetchAlerts: async () => {
        // Local-only store — no backend sync needed.
      },
    }),
    {
      name: KEYS.ALERTS,
      storage: createJSONStorage(() => mmkvStateStorage),
      partialize: (state) => ({ alerts: state.alerts }),
    }
  )
)
