import { crashlyticsService } from '@/services/api/crashlyticsService'
import {
  inAppUpdatesModule,
  type FlexibleUpdateResult,
  type InstallStatus,
  type UpdateInfo,
} from 'in-app-updates'

// Play's answers where no update can come from it, a build not installed from Play among them.
const PLAY_ERRORS_WITHOUT_UPDATE: ReadonlySet<string> = new Set(
  Object.values({
    API_NOT_AVAILABLE: -3,
    INSTALL_UNAVAILABLE: -5,
    INSTALL_NOT_ALLOWED: -6,
    PLAY_STORE_NOT_FOUND: -9,
    APP_NOT_OWNED: -10,
  }).map((code) => `E_INSTALL_${code}`)
)

const codeOf = (error: unknown): string =>
  typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : 'unknown'

const report = ({ error, source }: { error: unknown; source: string }): void => {
  const code = codeOf(error)
  if (PLAY_ERRORS_WITHOUT_UPDATE.has(code)) return
  void crashlyticsService.recordError(error, { source, code })
}

export const appUpdateService = {
  isSupported(): boolean {
    return inAppUpdatesModule !== null
  },

  async info(): Promise<UpdateInfo | null> {
    if (!inAppUpdatesModule) return null
    try {
      return await inAppUpdatesModule.getUpdateInfoAsync()
    } catch (error) {
      report({ error, source: 'app_update_info' })
      return null
    }
  },

  async startFlexible(): Promise<FlexibleUpdateResult> {
    if (!inAppUpdatesModule) return 'unavailable'
    try {
      return await inAppUpdatesModule.startFlexibleUpdateAsync()
    } catch (error) {
      report({ error, source: 'app_update_start' })
      return 'unavailable'
    }
  },

  async complete(): Promise<void> {
    if (!inAppUpdatesModule) return
    try {
      await inAppUpdatesModule.completeUpdateAsync()
    } catch (error) {
      report({ error, source: 'app_update_complete' })
    }
  },

  subscribe(listener: (status: InstallStatus) => void): () => void {
    if (!inAppUpdatesModule) return () => {}
    const subscription = inAppUpdatesModule.addListener('onInstallStateChange', (event) =>
      listener(event.installStatus)
    )
    return () => subscription.remove()
  },
}
