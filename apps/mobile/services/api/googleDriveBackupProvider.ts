import type { BackupProvider } from '@/types'
import { googleAuthService } from './googleAuthService'
import { googleDriveBackupService } from './googleDriveBackupService'

export const googleDriveBackupProvider: BackupProvider = {
  name: 'google_drive',

  signIn: () => googleAuthService.signIn(),
  signInSilently: () => googleAuthService.signInSilently(),
  signOut: () => googleAuthService.signOut(),
  isSignedIn: () => googleAuthService.isSignedIn(),
  uploadBackup: (data) => googleDriveBackupService.uploadBackup(data),
  downloadBackup: () => googleDriveBackupService.downloadBackup(),
  deleteBackup: () => googleDriveBackupService.deleteBackup(),
}
