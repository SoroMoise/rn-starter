import { engagementStorage } from '@/services/storage/domains/engagement'

export type SessionContext = {
  installDate: number
  sessionCount: number
  daysSinceInstall: number
}

let _sessionContext: SessionContext | null = null

export const engagementService = {
  async initSession(): Promise<SessionContext> {
    const now = Date.now()

    let installDate = engagementStorage.getInstallDate()
    if (!installDate) {
      installDate = now
      engagementStorage.setInstallDate(installDate)
    }

    const sessionCount = engagementStorage.getSessionCount() + 1
    engagementStorage.setSessionCount(sessionCount)

    const daysSinceInstall = Math.floor((now - installDate) / (24 * 60 * 60 * 1000))

    _sessionContext = { installDate, sessionCount, daysSinceInstall }
    return _sessionContext
  },

  getSessionContext(): SessionContext | null {
    return _sessionContext
  },

  async getPaywallContext(): Promise<{ paywallCount: number }> {
    const paywallCount = engagementStorage.getPaywallShownCount()
    return { paywallCount }
  },

  async incrementPaywallCount(): Promise<number> {
    const current = engagementStorage.getPaywallShownCount()
    const next = current + 1
    engagementStorage.setPaywallShownCount(next)
    return next
  },
}
