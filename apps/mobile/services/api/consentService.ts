import { crashlyticsService } from '@/services/api/crashlyticsService'
import { promoCoordinator } from '@/services/promo/promoCoordinator'
import mobileAds, {
  AdsConsent,
  AdsConsentPrivacyOptionsRequirementStatus,
  type AdsConsentInfo,
} from 'react-native-google-mobile-ads'

export type ConsentSnapshot = {
  canRequestAds: boolean
  arePrivacyOptionsRequired: boolean
}

const NO_CONSENT_YET: ConsentSnapshot = { canRequestAds: false, arePrivacyOptionsRequired: false }

/**
 * Google's UMP consent gate, and the only place the ads SDK is ever started.
 * Starting the SDK is what makes a request possible, so it cannot happen where
 * the consent state is unknown: `canRequestAds` defaults to false and every ad
 * surface reads it.
 */
class ConsentServiceClass {
  private snapshot: ConsentSnapshot = NO_CONSENT_YET
  private listeners = new Set<() => void>()
  private gathering: Promise<void> | null = null
  private isSdkStarted = false

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot = (): ConsentSnapshot => this.snapshot

  canRequestAds = (): boolean => this.snapshot.canRequestAds

  // Idempotent: the form is presented at most once per process.
  gather = (): Promise<void> => {
    this.gathering ??= this.run()
    return this.gathering
  }

  showPrivacyOptions = async (): Promise<void> => {
    try {
      this.apply(await this.presentForm(() => AdsConsent.showPrivacyOptionsForm()))
      await this.startSdk()
    } catch (err) {
      void crashlyticsService.recordError(err, { source: 'ads_consent_privacy_options' })
    }
  }

  private async run(): Promise<void> {
    let info: AdsConsentInfo | null = null

    try {
      info = await this.presentForm(() => AdsConsent.gatherConsent())
    } catch (err) {
      void crashlyticsService.recordError(err, { source: 'ads_consent_gather' })
      // A network failure shouldn't cost a decision already made — fall back to the cached one.
      try {
        info = await AdsConsent.getConsentInfo()
      } catch (readErr) {
        void crashlyticsService.recordError(readErr, { source: 'ads_consent_read' })
      }
    }

    this.apply(info)
    // Neither form nor cache reached — let a later launch retry rather than latch forever.
    if (info === null) this.gathering = null

    await this.startSdk()
  }

  // The form comes up over the app, at a launch too, where a deferred rating ask can fall due:
  // nothing automatic may land on it.
  private async presentForm<T>(show: () => Promise<T>): Promise<T> {
    promoCoordinator.setConsentFormVisible(true)
    try {
      return await show()
    } finally {
      promoCoordinator.setConsentFormVisible(false)
    }
  }

  private apply(info: AdsConsentInfo | null): void {
    const next: ConsentSnapshot = {
      canRequestAds: info?.canRequestAds === true,
      arePrivacyOptionsRequired:
        info?.privacyOptionsRequirementStatus ===
        AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
    }

    if (
      next.canRequestAds === this.snapshot.canRequestAds &&
      next.arePrivacyOptionsRequired === this.snapshot.arePrivacyOptionsRequired
    ) {
      return
    }

    this.snapshot = next
    this.listeners.forEach((listener) => listener())
  }

  private async startSdk(): Promise<void> {
    if (this.isSdkStarted || !this.snapshot.canRequestAds) return
    this.isSdkStarted = true
    try {
      await mobileAds().initialize()
    } catch (err) {
      this.isSdkStarted = false
      void crashlyticsService.recordError(err, { source: 'ads_sdk_initialize' })
    }
  }
}

export const consentService = new ConsentServiceClass()
