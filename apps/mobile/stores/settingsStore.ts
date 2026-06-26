import i18n, { loadLanguage } from '@/i18n/service'
import { mmkvStateStorage } from '@/services/storage/adapter'
import { KEYS } from '@/services/storage/keys'
import type { Language, UserSettings } from '@/types'
import { applyColorScheme } from '@/utils/colorScheme'
import { isRTLLanguage } from '@/utils/rtl'
import { DEFAULT_SETTINGS, RTL_RESTART_BANNER_ENABLED } from '@constants/config'
import { I18nManager } from 'react-native'
import RNRestart from 'react-native-restart'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { triggerBackupSync } from './backupTrigger'

// Lazy dynamic import breaks the settingsStore <-> widgetService init cycle:
// importing widgetService at module scope re-enters this store while it is still
// initializing (the "Require cycle" Metro warning). The module is resolved on a
// microtask, after init. Keep it lazy — do not hoist to a top import.
function syncWidgetFromStorage(): void {
  void import('@/services/widget/widgetService')
    .then(({ widgetService }) => widgetService.syncFromStorage())
    .catch(() => undefined)
}

interface SettingsStore {
  settings: UserSettings
  rtlRestartNeeded: boolean
  rtlRestartTrigger: number

  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void
  setLanguage: (language: Language) => void
  clearRTLRestartNeeded: () => void
  resetSettings: () => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      rtlRestartNeeded: false,
      rtlRestartTrigger: 0,

      updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
        set({ settings: { ...get().settings, [key]: value } })
        triggerBackupSync()
        if (key === 'defaultCurrencyFrom' || key === 'decimals') {
          syncWidgetFromStorage()
        }
      },

      setLanguage: (language: Language) => {
        const currentIsRTL = isRTLLanguage(get().settings.language)
        const newIsRTL = isRTLLanguage(language)

        set({ settings: { ...get().settings, language } })
        loadLanguage(language)
        i18n.changeLanguage(language)
        syncWidgetFromStorage()
        triggerBackupSync()

        if (currentIsRTL !== newIsRTL) {
          I18nManager.forceRTL(newIsRTL)
          if (RTL_RESTART_BANNER_ENABLED) {
            set({
              rtlRestartNeeded: true,
              rtlRestartTrigger: get().rtlRestartTrigger + 1,
            })
          } else {
            // forceRTL only takes effect after a restart: without the banner,
            // the app would stay in a half-flipped layout until a manual kill.
            RNRestart.restart()
          }
        }
      },

      clearRTLRestartNeeded: () => {
        set({ rtlRestartNeeded: false })
      },

      resetSettings: () => {
        set({ settings: DEFAULT_SETTINGS })
        triggerBackupSync()
        syncWidgetFromStorage()
      },
    }),
    {
      name: KEYS.USER_SETTINGS,
      storage: createJSONStorage(() => mmkvStateStorage),
      partialize: (state) => ({ settings: state.settings }),
      merge: (persisted, current) => {
        const persistedSettings = (persisted as { settings?: Partial<UserSettings> } | undefined)
          ?.settings
        return {
          ...current,
          ...(persisted as object),
          settings: { ...current.settings, ...(persistedSettings ?? {}) },
        }
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return
        applyColorScheme(state.settings.theme)
        const { language } = state.settings
        if (language) {
          loadLanguage(language)
          i18n.changeLanguage(language)
          const shouldBeRTL = isRTLLanguage(language)
          if (I18nManager.isRTL !== shouldBeRTL) {
            I18nManager.forceRTL(shouldBeRTL)
            RNRestart.restart()
          }
        }
      },
    }
  )
)
