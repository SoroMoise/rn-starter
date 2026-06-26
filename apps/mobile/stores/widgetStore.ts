import { mmkvStateStorage } from '@/services/storage/adapter'
import { KEYS } from '@/services/storage/keys'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { triggerBackupSync } from './backupTrigger'

export type PairKey = { from: string; to: string }

export type WidgetPairs = [PairKey, PairKey, PairKey]

export type WidgetPeriodDays = 7 | 30 | 90 | 270 | 365

export const WIDGET_PERIOD_OPTIONS: readonly WidgetPeriodDays[] = [7, 30, 90, 270, 365] as const

type WidgetState = {
  pairs: WidgetPairs
  period: WidgetPeriodDays
  setPair: (index: 0 | 1 | 2, pair: PairKey) => void
  swapPair: (index: 0 | 1 | 2) => void
  reorderPairs: (from: number, to: number) => void
  setPeriod: (period: WidgetPeriodDays) => void
}

const FALLBACK_PAIRS: WidgetPairs = [
  { from: 'EUR', to: 'USD' },
  { from: 'USD', to: 'JPY' },
  { from: 'GBP', to: 'EUR' },
]

function notifyMutation(): void {
  triggerBackupSync()
  // Lazy dynamic import breaks the widgetStore <-> widgetService init cycle (the
  // "Require cycle" Metro warning): the module is resolved on a microtask, after
  // init, never re-entered synchronously. Keep it lazy — do not hoist to a top import.
  void import('@/services/widget/widgetService')
    .then(({ widgetService }) => widgetService.syncFromStorage())
    .catch(() => undefined)
}

export const useWidgetStore = create<WidgetState>()(
  persist(
    (set, get) => ({
      pairs: FALLBACK_PAIRS,
      period: 7,

      setPair: (index, pair) => {
        const next = [...get().pairs] as WidgetPairs
        next[index] = pair
        set({ pairs: next })
        notifyMutation()
      },

      swapPair: (index) => {
        const current = get().pairs[index]
        const next = [...get().pairs] as WidgetPairs
        next[index] = { from: current.to, to: current.from }
        set({ pairs: next })
        notifyMutation()
      },

      reorderPairs: (from, to) => {
        const next = [...get().pairs] as WidgetPairs
        const [moved] = next.splice(from, 1)
        next.splice(to, 0, moved)
        set({ pairs: next })
        notifyMutation()
      },

      setPeriod: (period) => {
        set({ period })
        notifyMutation()
      },
    }),
    {
      name: KEYS.WIDGET_STORE,
      storage: createJSONStorage(() => mmkvStateStorage),
    }
  )
)
