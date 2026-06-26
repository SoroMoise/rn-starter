import { mmkvStateStorage } from '@/services/storage/adapter'
import { KEYS } from '@/services/storage/keys'
import { QUICK_CONVERSIONS_CONFIG } from '@constants/config'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { triggerBackupSync } from './backupTrigger'

interface QuickConversionsStore {
  quickCurrencies: string[]

  addCurrency: (code: string) => void
  addMultipleCurrencies: (codes: string[]) => void
  setMultipleCurrencies: (codes: string[]) => void
  removeCurrency: (code: string) => void
  insertCurrencyAt: (code: string, index: number) => void
  reorderCurrencies: (codes: string[]) => void
  resetToDefault: () => void
}

function notifyMutation(): void {
  triggerBackupSync()
}

export const useQuickConversionsStore = create<QuickConversionsStore>()(
  persist(
    (set, get) => ({
      quickCurrencies: QUICK_CONVERSIONS_CONFIG.DEFAULT_QUICK_CURRENCIES,

      addCurrency: (code: string) => {
        const { quickCurrencies } = get()
        if (quickCurrencies.includes(code)) return
        set({ quickCurrencies: [...quickCurrencies, code] })
        notifyMutation()
      },

      addMultipleCurrencies: (codes: string[]) => {
        const { quickCurrencies } = get()
        const newCurrencies = codes.filter((c) => !quickCurrencies.includes(c))
        if (newCurrencies.length === 0) return
        set({ quickCurrencies: [...quickCurrencies, ...newCurrencies] })
        notifyMutation()
      },

      setMultipleCurrencies: (codes: string[]) => {
        if (codes.length < QUICK_CONVERSIONS_CONFIG.MIN_QUICK_CURRENCIES) return
        set({ quickCurrencies: codes })
        notifyMutation()
      },

      removeCurrency: (code: string) => {
        const { quickCurrencies } = get()
        if (quickCurrencies.length <= QUICK_CONVERSIONS_CONFIG.MIN_QUICK_CURRENCIES) return
        set({ quickCurrencies: quickCurrencies.filter((c) => c !== code) })
        notifyMutation()
      },

      insertCurrencyAt: (code: string, index: number) => {
        const { quickCurrencies } = get()
        if (quickCurrencies.includes(code)) return
        const clamped = Math.max(0, Math.min(index, quickCurrencies.length))
        set({
          quickCurrencies: [
            ...quickCurrencies.slice(0, clamped),
            code,
            ...quickCurrencies.slice(clamped),
          ],
        })
        notifyMutation()
      },

      reorderCurrencies: (codes: string[]) => {
        set({ quickCurrencies: codes })
        notifyMutation()
      },

      resetToDefault: () => {
        set({ quickCurrencies: QUICK_CONVERSIONS_CONFIG.DEFAULT_QUICK_CURRENCIES })
        notifyMutation()
      },
    }),
    {
      name: KEYS.QUICK_CONVERSIONS,
      storage: createJSONStorage(() => mmkvStateStorage),
      partialize: (state) => ({ quickCurrencies: state.quickCurrencies }),
    }
  )
)
