import { consentService, type ConsentSnapshot } from '@/services/api/consentService'
import { useSyncExternalStore } from 'react'

export function useAdsConsent(): ConsentSnapshot {
  return useSyncExternalStore(
    consentService.subscribe,
    consentService.getSnapshot,
    consentService.getSnapshot
  )
}
