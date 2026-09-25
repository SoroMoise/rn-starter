import { contextualSource, type ContextualTrigger } from '@/constants/contextualPaywall'
import { usePremium } from '@/hooks/usePremium'
import { contextualPaywallService } from '@/services/api/contextualPaywall'
import { promoCoordinator } from '@/services/promo/promoCoordinator'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { useCallback } from 'react'

export function useContextualPaywall() {
  const { isPremium, isInitialized, defaultPlan, openPaywall } = usePremium()
  const isOnboardingCompleted = useOnboardingStore((s) => s.isCompleted)

  const maybeTrigger = useCallback(
    (trigger: ContextualTrigger): boolean => {
      if (!isInitialized) return false
      // Initialised is not offered: a failed getOfferings() still ends the boot, and an
      // impression spent on a paywall with nothing to buy is one of a lifetime few.
      if (!defaultPlan) return false
      if (promoCoordinator.isSurfaceVisible()) return false
      const now = Date.now()
      const decision = contextualPaywallService.evaluate({
        isPremium,
        isOnboardingCompleted,
        now,
      })
      if (!decision.show) return false
      contextualPaywallService.recordShown(now)
      void openPaywall({ source: contextualSource(trigger) })
      return true
    },
    [isInitialized, isPremium, isOnboardingCompleted, defaultPlan, openPaywall]
  )

  return { maybeTrigger }
}
