import type { UserSettings } from './settings'

type ExportType = 'conversion' | 'historical' | 'allRates'
type ExportFormat = 'csv' | 'pdf'
type ExportPreferences = Record<ExportType, ExportFormat | null>

export type BackupData = {
  version: number
  updatedAt: string
  data: {
    quickCurrencies: string[]
    settings: UserSettings
    lastConversion: { amount: string; fromCurrencyCode: string } | null
    ratingState: { hasRated: boolean; declinedForever: boolean }
    adFreeUntil?: number | null
    exportPreferences?: { preferences: ExportPreferences; lastUsed: ExportPreferences }
    ratingTracking?: {
      totalSuccessfulConversions: number
      promptCount: number
      lastPromptExecution: number
      firstUsageDate: number | null
      lastPromptDate: number
    }
  }
}

export type BackupProviderName = 'google_drive' | 'icloud'

export interface BackupProvider {
  readonly name: BackupProviderName
  signIn(): Promise<{ email: string } | null>
  signInSilently(): Promise<{ email: string } | null>
  signOut(): Promise<void>
  isSignedIn(): Promise<boolean>
  uploadBackup(data: BackupData): Promise<void>
  downloadBackup(): Promise<BackupData | null>
  deleteBackup(): Promise<void>
}
