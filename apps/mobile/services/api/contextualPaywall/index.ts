import { conversionStorage } from '@/services/storage/domains/conversion'
import { crashlyticsService } from '@/services/api/crashlyticsService'
import { engagementStorage } from '@/services/storage/domains/engagement'
import { promoCoordinator } from '@/services/promo/promoCoordinator'
import {
  evaluateContextualPaywall,
  type ContextualPaywallDecision,
} from '@/services/api/contextualPaywall/policy'

export const contextualPaywallService = {
  resetSession(): void {
    promoCoordinator.resetSession()
  },

  evaluate({
    isPremium,
    isOnboardingCompleted,
    now,
  }: {
    isPremium: boolean
    isOnboardingCompleted: boolean
    now: number
  }): ContextualPaywallDecision {
    return evaluateContextualPaywall({
      isPremium,
      isOnboardingCompleted,
      sessionCount: engagementStorage.getSessionCount(),
      totalConversions: conversionStorage.getTotalSuccessful(),
      contextualShownCount: engagementStorage.getContextualShownCount(),
      lastContextualPaywallAt: engagementStorage.getLastContextualPaywallAt(),
      shownThisSession: promoCoordinator.autoPromoShown(),
      now,
    })
  },

  recordShown(now: number): void {
    try {
      engagementStorage.setLastContextualPaywallAt(now)
      engagementStorage.incrementContextualShownCount()
    } catch (err) {
      void crashlyticsService.recordError(err, { source: 'contextual_paywall_record_shown' })
    }
    promoCoordinator.markAutoPromoShown()
  },
}
