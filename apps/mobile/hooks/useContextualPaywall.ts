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
      // Recorded once the paywall is really up: the choke point can still refuse it.
      void openPaywall({ source: contextualSource(trigger) }).then((opened) => {
        if (opened) contextualPaywallService.recordShown(now)
      })
      return true
    },
    [isInitialized, isPremium, isOnboardingCompleted, defaultPlan, openPaywall]
  )

  return { maybeTrigger }
}
