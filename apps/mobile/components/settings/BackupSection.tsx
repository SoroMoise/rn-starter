import { Divider } from '@/components/settings/SettingsSection'
import { ThemedText } from '@/components/ui/ThemedText'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { useToast } from '@/providers/ToastProvider'
import { useBackupStore } from '@/stores/backupStore'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useShallow } from 'zustand/react/shallow'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Alert, TouchableOpacity, View } from 'react-native'

function formatBackupDate(isoDate: string): string {
  const date = new Date(isoDate)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function BackupSectionInner() {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const { isOnline } = useNetworkStatus()
  const {
    isSignedIn,
    userEmail,
    lastBackupAt,
    isSyncing,
    isRestoring,
    isSigningIn,
    error,
    signIn,
    signOut,
    syncNow,
    restore,
  } = useBackupStore(
    useShallow((s) => ({
      isSignedIn: s.isSignedIn,
      userEmail: s.userEmail,
      lastBackupAt: s.lastBackupAt,
      isSyncing: s.isSyncing,
      isRestoring: s.isRestoring,
      isSigningIn: s.isSigningIn,
      error: s.error,
      signIn: s.signIn,
      signOut: s.signOut,
      syncNow: s.syncNow,
      restore: s.restore,
    }))
  )

  const isBusy = isSyncing || isRestoring

  const handleConnect = () => {
    void signIn()
  }

  const handleBackupNow = () => {
    if (!isOnline) {
      showToast({ message: t('backup.offlineToast'), type: 'warning' })
      return
    }
    void syncNow().then(() => {
      if (!useBackupStore.getState().error) {
        showToast({ message: t('backup.backupSuccess'), type: 'success' })
      }
    })
  }

  const handleRestore = () => {
    if (!isOnline) {
      showToast({ message: t('backup.offlineToast'), type: 'warning' })
      return
    }
    Alert.alert(
      t('backup.restoreConfirmTitle'),
      t('backup.restoreConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('backup.restore'),
          onPress: () => {
            void restore().then(() => {
              if (!useBackupStore.getState().error) {
                showToast({ message: t('backup.restoreSuccess'), type: 'success' })
              }
            })
          },
        },
      ],
      { cancelable: true }
    )
  }

  const handleRetrySync = () => {
    if (!isOnline) {
      showToast({ message: t('backup.offlineToast'), type: 'warning' })
      return
    }
    void syncNow()
  }

  const handleDisconnect = () => {
    Alert.alert(
      t('backup.disconnect'),
      t('backup.disconnectConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('backup.disconnect'), style: 'destructive', onPress: () => void signOut() },
      ],
      { cancelable: true }
    )
  }

  const lastBackupLabel = lastBackupAt
    ? t('backup.lastBackup', { date: formatBackupDate(lastBackupAt) })
    : t('backup.neverBacked')

  if (!isSignedIn || isSigningIn) {
    return <BackupConnectCard onPress={handleConnect} isLoading={isSigningIn} />
  }

  return (
    <>
      <View className="flex-row items-center px-4 py-2.5">
        <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-green-100 dark:bg-green-500/20">
          <Ionicons name="cloud-done-outline" size={18} color="#10b981" />
        </View>
        <View className="flex-1">
          <ThemedText variant="body" weight="medium">
            {t('backup.connected')}
          </ThemedText>
          <ThemedText variant="caption" color="muted" weight="normal">
            {userEmail ?? ''}
          </ThemedText>
          <ThemedText variant="caption" color="muted" weight="normal" className="mt-0.5">
            {lastBackupLabel}
          </ThemedText>
        </View>
      </View>

      {error ? (
        <View className="mx-4 mb-2 flex-row items-center gap-2 rounded-xl bg-red-50 px-3 py-2 dark:bg-red-500/10">
          <Ionicons name="warning-outline" size={14} color="#ef4444" />
          <ThemedText variant="caption" className="flex-1 text-red-500">
            {t('backup.error')}
          </ThemedText>
          <TouchableOpacity onPress={handleRetrySync} activeOpacity={0.6}>
            <ThemedText variant="caption" className="text-red-500 underline">
              {t('backup.retry')}
            </ThemedText>
          </TouchableOpacity>
        </View>
      ) : null}

      <Divider />

      <TouchableOpacity
        onPress={handleBackupNow}
        disabled={isBusy}
        className="flex-row items-center px-4 py-2.5"
        activeOpacity={0.6}>
        <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-500/20">
          {isSyncing && !isRestoring ? (
            <ActivityIndicator size="small" color="#3b82f6" />
          ) : (
            <Ionicons name="cloud-upload-outline" size={18} color="#3b82f6" />
          )}
        </View>
        <ThemedText variant="body" weight="medium" className="flex-1">
          {isSyncing && !isRestoring ? t('backup.syncing') : t('backup.backupNow')}
        </ThemedText>
      </TouchableOpacity>

      <Divider />

      <TouchableOpacity
        onPress={handleRestore}
        disabled={isBusy}
        className="flex-row items-center px-4 py-2.5"
        activeOpacity={0.6}>
        <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/20">
          {isRestoring ? (
            <ActivityIndicator size="small" color="#f59e0b" />
          ) : (
            <Ionicons name="cloud-download-outline" size={18} color="#f59e0b" />
          )}
        </View>
        <ThemedText variant="body" weight="medium" className="flex-1">
          {isRestoring ? t('backup.restoring') : t('backup.restore')}
        </ThemedText>
      </TouchableOpacity>

      <Divider />

      <TouchableOpacity
        onPress={handleDisconnect}
        className="flex-row items-center px-4 py-2.5"
        activeOpacity={0.6}>
        <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-red-100 dark:bg-red-500/20">
          <Ionicons name="cloud-offline-outline" size={18} color="#ef4444" />
        </View>
        <ThemedText variant="body" weight="medium" className="flex-1 text-red-500">
          {t('backup.disconnect')}
        </ThemedText>
      </TouchableOpacity>
    </>
  )
}

function BackupConnectCard({ onPress, isLoading }: { onPress: () => void; isLoading: boolean }) {
  const { t } = useTranslation()

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.7}
      className="items-center gap-2 px-5 py-4">
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-500/20">
        <Ionicons name="cloud-upload-outline" size={25} color="#3b82f6" />
      </View>
      <View className="items-center gap-1.5">
        <ThemedText variant="body" weight="semibold">
          {t('backup.connectGoogle')}
        </ThemedText>
        <ThemedText variant="caption" color="muted" weight="normal" className="px-4 text-center">
          {t('backup.connectDescription')}
        </ThemedText>
      </View>
      <View className="h-10 flex-row items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5">
        {isLoading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <>
            <Ionicons name="logo-google" size={15} color="#ffffff" />
            <ThemedText
              variant="label"
              weight="semibold"
              color="inherit"
              style={{ color: '#ffffff' }}>
              {t('backup.connectGoogle')}
            </ThemedText>
          </>
        )}
      </View>
    </TouchableOpacity>
  )
}
