import { Platform } from 'react-native'
import type { BackupProvider } from '@/types'
import { googleDriveBackupProvider } from './googleDriveBackupProvider'
// import { iCloudBackupProvider } from './iCloudBackupProvider' // future iOS

export function getActiveBackupProvider(): BackupProvider | null {
  if (Platform.OS === 'android') return googleDriveBackupProvider
  // iOS: uncomment when iCloud is implemented
  // if (Platform.OS === 'ios') return iCloudBackupProvider
  return null
}
