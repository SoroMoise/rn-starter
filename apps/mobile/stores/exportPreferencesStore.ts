import { mmkvStateStorage } from '@/services/storage/adapter'
import { KEYS } from '@/services/storage/keys'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { triggerBackupSync } from './backupTrigger'

export type ExportType = 'conversion' | 'historical' | 'allRates'
export type ExportFormat = 'csv' | 'pdf'

type Preferences = Record<ExportType, ExportFormat | null>

interface ExportPreferencesStore {
  preferences: Preferences
  lastUsed: Preferences

  setPreference: (params: { type: ExportType; format: ExportFormat | null }) => void
  getPreference: (params: { type: ExportType }) => ExportFormat | null
  setLastUsed: (params: { type: ExportType; format: ExportFormat }) => void
  getLastUsed: (params: { type: ExportType }) => ExportFormat | null
  clearPreferences: () => void
}

const DEFAULT_PREFERENCES: Preferences = {
  conversion: null,
  historical: null,
  allRates: null,
}

export const useExportPreferencesStore = create<ExportPreferencesStore>()(
  persist(
    (set, get) => ({
      preferences: DEFAULT_PREFERENCES,
      lastUsed: DEFAULT_PREFERENCES,

      setPreference: ({ type, format }) => {
        set({ preferences: { ...get().preferences, [type]: format } })
        triggerBackupSync()
      },

      getPreference: ({ type }) => get().preferences[type],

      setLastUsed: ({ type, format }) => {
        set({ lastUsed: { ...get().lastUsed, [type]: format } })
        triggerBackupSync()
      },

      getLastUsed: ({ type }) => get().lastUsed[type],

      clearPreferences: () =>
        set({ preferences: DEFAULT_PREFERENCES, lastUsed: DEFAULT_PREFERENCES }),
    }),
    {
      name: KEYS.EXPORT_PREFERENCES,
      storage: createJSONStorage(() => mmkvStateStorage),
      partialize: (state) => ({
        preferences: state.preferences,
        lastUsed: state.lastUsed,
      }),
    }
  )
)
