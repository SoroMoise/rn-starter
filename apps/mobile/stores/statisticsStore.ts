import { mmkvStateStorage } from '@/services/storage/adapter'
import type { Period } from '@/types'
import { DEFAULT_SETTINGS } from '@constants/config'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface StatisticsFiltersStore {
  fromCurrency: string
  toCurrency: string
  period: Period
  isManualMode: boolean

  setPeriod: (period: Period) => void
  setCurrenciesManually: (from: string, to: string) => void
  syncFromConversion: (from: string, to: string) => void
  resetToAuto: () => void
}

export const useStatisticsStore = create<StatisticsFiltersStore>()(
  persist(
    (set, get) => ({
      fromCurrency: DEFAULT_SETTINGS.defaultCurrencyFrom,
      toCurrency: DEFAULT_SETTINGS.defaultCurrencyTo,
      period: 7,
      isManualMode: false,

      setPeriod: (period) => set({ period }),

      setCurrenciesManually: (from, to) =>
        set({ fromCurrency: from, toCurrency: to, isManualMode: true }),

      syncFromConversion: (from, to) => {
        if (get().isManualMode) return
        set({ fromCurrency: from, toCurrency: to })
      },

      resetToAuto: () => set({ isManualMode: false }),
    }),
    {
      name: 'statistics-filters',
      storage: createJSONStorage(() => mmkvStateStorage),
      partialize: (state) => ({
        fromCurrency: state.fromCurrency,
        toCurrency: state.toCurrency,
        period: state.period,
        isManualMode: state.isManualMode,
      }),
    }
  )
)
