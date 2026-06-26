import { alertsService } from '@/services/api/alertsService'
import { crashlyticsService } from '@/services/api/crashlyticsService'
import { mmkvStateStorage } from '@/services/storage/adapter'
import { handleAxiosError } from '@/utils/apiErrors'
import { KEYS } from '@/services/storage/keys'
import type { CreateAlertParams, RateAlert } from '@/types'
import Purchases from 'react-native-purchases'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface AlertsStore {
  alerts: RateAlert[]
  isLoading: boolean
  error: string | null
  fetchAlerts: () => Promise<void>
  createAlert: (params: CreateAlertParams) => Promise<void>
  editAlert: ({ alertId, params }: { alertId: string; params: CreateAlertParams }) => Promise<void>
  deleteAlert: ({ alertId }: { alertId: string }) => Promise<void>
}

async function getRcCustomerId(): Promise<string | null> {
  try {
    const { originalAppUserId } = await Purchases.getCustomerInfo()
    return originalAppUserId
  } catch {
    return null
  }
}

let tempIdCounter = 0

function buildOptimisticAlert({
  rcCustomerId,
  params,
}: {
  rcCustomerId: string
  params: CreateAlertParams
}): RateAlert {
  const base = {
    id: `temp-${Date.now()}-${++tempIdCounter}`,
    rcCustomerId,
    fromCurrency: params.fromCurrency,
    toCurrency: params.toCurrency,
    createdAt: new Date().toISOString(),
    isActive: true,
  }
  if (params.triggerType === 'variation') {
    return {
      ...base,
      triggerType: 'variation',
      variationPercent: params.variationPercent,
      baselineRate: params.baselineRate,
    }
  }
  return {
    ...base,
    triggerType: 'threshold',
    direction: params.direction,
    targetRate: params.targetRate,
  }
}

function buildOptimisticEdit({
  original,
  params,
}: {
  original: RateAlert
  params: CreateAlertParams
}): RateAlert {
  const base = {
    id: original.id,
    rcCustomerId: original.rcCustomerId,
    fromCurrency: params.fromCurrency,
    toCurrency: params.toCurrency,
    createdAt: original.createdAt,
    isActive: original.isActive,
  }
  if (params.triggerType === 'variation') {
    return {
      ...base,
      triggerType: 'variation',
      variationPercent: params.variationPercent,
      baselineRate: params.baselineRate,
    }
  }
  return {
    ...base,
    triggerType: 'threshold',
    direction: params.direction,
    targetRate: params.targetRate,
  }
}

export const useAlertsStore = create<AlertsStore>()(
  persist(
    (set, get) => ({
      alerts: [],
      isLoading: false,
      error: null,

      fetchAlerts: async () => {
        const rcCustomerId = await getRcCustomerId()
        if (!rcCustomerId) return

        set({ isLoading: true, error: null })
        try {
          const alerts = await alertsService.fetchAlerts({ rcCustomerId })
          set({ alerts, isLoading: false })
        } catch (err) {
          const apiError = handleAxiosError(err)
          crashlyticsService.recordError(err instanceof Error ? err : new Error(apiError.message), {
            source: 'alertsStore.fetchAlerts',
          })
          set({ isLoading: false, error: apiError.message })
        }
      },

      createAlert: async (params: CreateAlertParams) => {
        const rcCustomerId = await getRcCustomerId()
        if (!rcCustomerId) throw new Error('Not authenticated')

        const tempAlert = buildOptimisticAlert({ rcCustomerId, params })
        set({ alerts: [...get().alerts, tempAlert] })

        try {
          const created = await alertsService.createAlert({ rcCustomerId, params })
          set({ alerts: get().alerts.map((a) => (a.id === tempAlert.id ? created : a)) })
        } catch (err) {
          set({ alerts: get().alerts.filter((a) => a.id !== tempAlert.id) })
          crashlyticsService.recordError(
            err instanceof Error ? err : new Error('createAlert failed'),
            {
              source: 'alertsStore.createAlert',
            }
          )
          throw err
        }
      },

      editAlert: async ({ alertId, params }: { alertId: string; params: CreateAlertParams }) => {
        const rcCustomerId = await getRcCustomerId()
        if (!rcCustomerId) throw new Error('Not authenticated')

        const original = get().alerts.find((a) => a.id === alertId)
        if (!original) throw new Error('Alert not found')

        const optimistic = buildOptimisticEdit({ original, params })
        set({ alerts: get().alerts.map((a) => (a.id === alertId ? optimistic : a)) })

        try {
          const updated = await alertsService.editAlert({ rcCustomerId, alertId, params })
          set({ alerts: get().alerts.map((a) => (a.id === alertId ? updated : a)) })
        } catch (err) {
          set({ alerts: get().alerts.map((a) => (a.id === alertId ? original : a)) })
          crashlyticsService.recordError(
            err instanceof Error ? err : new Error('editAlert failed'),
            {
              source: 'alertsStore.editAlert',
            }
          )
          throw err
        }
      },

      deleteAlert: async ({ alertId }: { alertId: string }) => {
        const rcCustomerId = await getRcCustomerId()
        if (!rcCustomerId) throw new Error('Not authenticated')

        const removed = get().alerts.find((a) => a.id === alertId)
        set({ alerts: get().alerts.filter((a) => a.id !== alertId) })

        try {
          await alertsService.deleteAlert({ rcCustomerId, alertId })
        } catch (err) {
          if (removed && !get().alerts.some((a) => a.id === alertId)) {
            set({ alerts: [...get().alerts, removed] })
          }
          crashlyticsService.recordError(
            err instanceof Error ? err : new Error('deleteAlert failed'),
            {
              source: 'alertsStore.deleteAlert',
            }
          )
          throw err
        }
      },
    }),
    {
      name: KEYS.ALERTS,
      storage: createJSONStorage(() => mmkvStateStorage),
      partialize: (state) => ({ alerts: state.alerts }),
    }
  )
)
