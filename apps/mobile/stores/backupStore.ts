import { getIsOnline, subscribeToNetworkStatus } from '@/hooks/useNetworkStatus'
import i18n, { loadLanguage } from '@/i18n/service'
import { getActiveBackupProvider } from '@/services/api/activeBackupProvider'
import { analyticsService } from '@/services/api/analyticsService'
import { crashlyticsService } from '@/services/api/crashlyticsService'
import { adFreeStorage } from '@/services/storage/domains/adFree'
import { backupStorage } from '@/services/storage/domains/backup'
import { conversionStorage } from '@/services/storage/domains/conversion'
import { ratingStorage } from '@/services/storage/domains/rating'
import { widgetService } from '@/services/widget/widgetService'
import type { BackupData } from '@/types'
import { isRTLLanguage } from '@/utils/rtl'
import { Alert, I18nManager } from 'react-native'
import RNRestart from 'react-native-restart'
import { create } from 'zustand'
import { cancelPendingBackupSync, registerBackupSyncFn } from './backupTrigger'
import { useExportPreferencesStore } from './exportPreferencesStore'
import { useQuickConversionsStore } from './quickConversionsStore'
import { useSettingsStore } from './settingsStore'

interface BackupStore {
  isSignedIn: boolean
  userEmail: string | null
  lastBackupAt: string | null
  isSyncing: boolean
  isRestoring: boolean
  isSigningIn: boolean
  hasPendingSync: boolean
  hasPendingRestoreOffer: boolean
  error: string | null
  isLoaded: boolean

  initialize: () => Promise<void>
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  syncNow: () => Promise<void>
  restore: () => Promise<void>
  setSyncing: (value: boolean) => void
  setError: (error: string | null) => void
}

function collectBackupPayload(): BackupData['data'] {
  const settings = useSettingsStore.getState().settings
  const quickCurrencies = useQuickConversionsStore.getState().quickCurrencies
  const lastConversion = conversionStorage.getLast()
  const hasRated = ratingStorage.getHasRated()
  const declinedForever = ratingStorage.getDeclinedForever()
  const adFreeUntil = adFreeStorage.getUntil()
  const { preferences, lastUsed } = useExportPreferencesStore.getState()

  return {
    settings,
    quickCurrencies,
    lastConversion,
    ratingState: { hasRated, declinedForever },
    adFreeUntil,
    exportPreferences: { preferences, lastUsed },
    ratingTracking: {
      totalSuccessfulConversions: conversionStorage.getTotalSuccessful(),
      promptCount: ratingStorage.getPromptCount(),
      lastPromptExecution: ratingStorage.getLastPromptExecution(),
      firstUsageDate: ratingStorage.getFirstUsageDate(),
      lastPromptDate: ratingStorage.getLastPromptDate(),
    },
  }
}

let inFlightSync: Promise<void> | null = null

export const useBackupStore = create<BackupStore>((set, get) => ({
  isSignedIn: false,
  userEmail: null,
  lastBackupAt: null,
  isSyncing: false,
  isRestoring: false,
  isSigningIn: false,
  hasPendingSync: false,
  hasPendingRestoreOffer: false,
  error: null,
  isLoaded: false,

  setSyncing: (value) => set({ isSyncing: value }),
  setError: (error) => set({ error }),

  initialize: async () => {
    const provider = getActiveBackupProvider()
    if (!provider) {
      set({ isLoaded: true })
      return
    }
    try {
      const lastSync = backupStorage.getLastSync()
      const savedEmail = backupStorage.getUserEmail()
      const lastOffered = backupStorage.getLastOffered()

      const user = await provider.signInSilently()
      if (!user) {
        const hadPreviousSession = await provider.isSignedIn()
        set({
          isSignedIn: hadPreviousSession,
          userEmail: savedEmail,
          lastBackupAt: lastSync,
          isLoaded: true,
        })
        return
      }

      set({ isSignedIn: true, userEmail: user.email, lastBackupAt: lastSync, isLoaded: true })
      backupStorage.setUserEmail(user.email)

      const remoteBackup = await provider.downloadBackup()
      const isNewerThanSync = remoteBackup && (!lastSync || remoteBackup.updatedAt > lastSync)
      const isAlreadyOffered = remoteBackup && lastOffered === remoteBackup.updatedAt
      if (isNewerThanSync && !isAlreadyOffered) {
        set({ hasPendingRestoreOffer: true })
        Alert.alert(
          i18n.t('backup.importConfirmTitle'),
          i18n.t('backup.importConfirmMessage'),
          [
            {
              text: i18n.t('common.cancel'),
              style: 'cancel',
              onPress: () => {
                backupStorage.setLastOffered(remoteBackup.updatedAt)
                set({ hasPendingRestoreOffer: false })
                void get().syncNow()
              },
            },
            {
              text: i18n.t('backup.restore'),
              onPress: () => {
                backupStorage.setLastOffered(remoteBackup.updatedAt)
                set({ hasPendingRestoreOffer: false })
                void get().restore()
              },
            },
          ],
          { cancelable: false }
        )
      }
    } catch (error) {
      void crashlyticsService.recordError(error, { source: 'backup_initialize' })
      set({ isLoaded: true })
    }
  },

  signIn: async () => {
    const provider = getActiveBackupProvider()
    if (!provider) return
    set({ error: null, isSigningIn: true })
    try {
      const user = await provider.signIn()
      if (!user) {
        set({ isSigningIn: false })
        return
      }

      set({ isSignedIn: true, userEmail: user.email })
      backupStorage.setUserEmail(user.email)
      analyticsService.track('backup_connected')

      const remoteBackup = await provider.downloadBackup()
      set({ isSigningIn: false })
      if (remoteBackup) {
        set({ hasPendingRestoreOffer: true })
        Alert.alert(
          i18n.t('backup.importConfirmTitle'),
          i18n.t('backup.importConfirmMessage'),
          [
            {
              text: i18n.t('common.cancel'),
              style: 'cancel',
              onPress: () => {
                backupStorage.setLastOffered(remoteBackup.updatedAt)
                set({ hasPendingRestoreOffer: false })
                void get().syncNow()
              },
            },
            {
              text: i18n.t('backup.restore'),
              onPress: () => {
                backupStorage.setLastOffered(remoteBackup.updatedAt)
                set({ hasPendingRestoreOffer: false })
                void get().restore()
              },
            },
          ],
          { cancelable: false }
        )
      } else {
        await get().syncNow()
      }
    } catch (error) {
      void crashlyticsService.recordError(error, { source: 'backup_sign_in' })
      set({ error: 'sign_in_failed', isSigningIn: false })
    }
  },

  signOut: async () => {
    const provider = getActiveBackupProvider()
    try {
      await provider?.signOut()
    } catch (error) {
      void crashlyticsService.recordError(error, { source: 'backup_sign_out' })
    }
    backupStorage.clear()
    set({
      isSignedIn: false,
      userEmail: null,
      lastBackupAt: null,
      error: null,
      hasPendingSync: false,
      hasPendingRestoreOffer: false,
    })
    analyticsService.track('backup_disconnected')
  },

  syncNow: async () => {
    const provider = getActiveBackupProvider()
    const { isSignedIn, isSyncing, isRestoring, hasPendingRestoreOffer } = get()
    if (!provider || !isSignedIn || isSyncing || isRestoring || hasPendingRestoreOffer) return

    if (!getIsOnline()) {
      set({ hasPendingSync: true, error: null })
      return
    }

    set({ isSyncing: true, error: null })
    const run = (async () => {
      try {
        const data = collectBackupPayload()
        const now = new Date().toISOString()
        const backup: BackupData = { version: 1, updatedAt: now, data }

        await provider.uploadBackup(backup)
        backupStorage.setLastSync(now)
        set({ lastBackupAt: now, hasPendingSync: false })
        analyticsService.track('backup_sync')
      } catch (error) {
        void crashlyticsService.recordError(error, { source: 'backup_sync' })
        set({ error: 'sync_failed' })
        analyticsService.track('backup_error')
      } finally {
        set({ isSyncing: false })
        inFlightSync = null
      }
    })()
    inFlightSync = run
    await run
  },

  restore: async () => {
    const provider = getActiveBackupProvider()
    if (!provider) return

    // Cancel any pending debounced sync, then wait for an already-started
    // upload to settle: applying a restore while an upload is in flight could
    // push the pre-restore state back to Drive.
    cancelPendingBackupSync()
    set({ isRestoring: true, error: null })
    if (inFlightSync) await inFlightSync

    set({ isSyncing: true })
    let backup: BackupData | null = null
    try {
      backup = await provider.downloadBackup()
    } catch (error) {
      void crashlyticsService.recordError(error, { source: 'backup_restore_download' })
      set({ isSyncing: false, isRestoring: false, error: 'restore_network' })
      analyticsService.track('backup_error')
      return
    }

    if (!backup) {
      set({ isSyncing: false, isRestoring: false })
      return
    }

    try {
      const { data } = backup

      const isValidPayload =
        data != null &&
        typeof data === 'object' &&
        data.settings != null &&
        typeof data.settings === 'object' &&
        Array.isArray(data.quickCurrencies) &&
        data.ratingState != null &&
        typeof data.ratingState.hasRated === 'boolean' &&
        typeof data.ratingState.declinedForever === 'boolean'
      if (!isValidPayload) {
        set({ isSyncing: false, isRestoring: false, error: 'restore_corrupted' })
        analyticsService.track('backup_error')
        return
      }

      useSettingsStore.setState({ settings: data.settings })
      useQuickConversionsStore.setState({ quickCurrencies: data.quickCurrencies })
      if (data.lastConversion) conversionStorage.saveLast(data.lastConversion)
      ratingStorage.setHasRated(data.ratingState.hasRated)
      ratingStorage.setDeclinedForever(data.ratingState.declinedForever)
      adFreeStorage.setUntil(data.adFreeUntil ?? null)
      if (data.exportPreferences) {
        useExportPreferencesStore.setState({
          preferences: data.exportPreferences.preferences,
          lastUsed: data.exportPreferences.lastUsed,
        })
      }
      if (data.ratingTracking) {
        conversionStorage.saveTotalSuccessful(data.ratingTracking.totalSuccessfulConversions)
        ratingStorage.setPromptCount(data.ratingTracking.promptCount)
        ratingStorage.setLastPromptExecution(data.ratingTracking.lastPromptExecution)
        if (data.ratingTracking.firstUsageDate !== null) {
          ratingStorage.setFirstUsageDate(data.ratingTracking.firstUsageDate)
        }
        ratingStorage.setLastPromptDate(data.ratingTracking.lastPromptDate)
      }

      backupStorage.setLastSync(backup.updatedAt)
      set({ lastBackupAt: backup.updatedAt, isSyncing: false, isRestoring: false })
      analyticsService.track('backup_restore')

      // Restored base currency / decimals / quick conversions must reach the
      // Android widget without waiting for the next app boot.
      void widgetService.syncFromStorage()

      // Re-apply i18n + RTL after restore (mirrors settingsStore.onRehydrateStorage).
      // RNRestart.restart() never returns, so analytics + state cleanup above
      // must run BEFORE this block.
      const restoredLanguage = data.settings.language
      if (restoredLanguage) {
        loadLanguage(restoredLanguage)
        i18n.changeLanguage(restoredLanguage)
        const shouldBeRTL = isRTLLanguage(restoredLanguage)
        if (I18nManager.isRTL !== shouldBeRTL) {
          I18nManager.forceRTL(shouldBeRTL)
          RNRestart.restart()
        }
      }
    } catch (error) {
      void crashlyticsService.recordError(error, { source: 'backup_restore_apply' })
      set({ isSyncing: false, isRestoring: false, error: 'restore_corrupted' })
      analyticsService.track('backup_error')
    }
  },
}))

registerBackupSyncFn(() => {
  const { isSignedIn, syncNow } = useBackupStore.getState()
  if (isSignedIn) void syncNow()
})

subscribeToNetworkStatus((online) => {
  if (!online) return
  const { isSignedIn, hasPendingSync, syncNow } = useBackupStore.getState()
  if (isSignedIn && hasPendingSync) void syncNow()
})
