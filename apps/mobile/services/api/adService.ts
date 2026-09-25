import { AD_INTERSTITIAL_ENABLED, ADMOB_INTERSTITIAL_ID } from '@/constants/admob'
import { adsAllowedInEnvironment } from '@/services/api/adEnvironment'
import { consentService } from '@/services/api/consentService'
import { engagementService } from '@/services/api/engagementService'
import { presentFullScreenAd, type PresentationOutcome } from '@/services/api/fullScreenAd'
import { promoCoordinator } from '@/services/promo/promoCoordinator'
import { adsStorage } from '@/services/storage/domains/ads'
import { AdEventType, InterstitialAd } from 'react-native-google-mobile-ads'

const MIN_INTERVAL_MS = 90 * 1000
const INITIAL_EXECUTIONS_THRESHOLD = 4
const PROGRESSIVE_EXECUTIONS_THRESHOLD = 2
const INTERSTITIAL_RAMP_UP_DAYS = 7
const MAX_LOAD_RETRIES = 3
const BASE_RETRY_DELAY_MS = 30_000

class AdServiceClass {
  private interstitialAd: InterstitialAd | null = null
  private detachInterstitial: (() => void) | null = null
  private isAdLoaded = false
  private isAdLoading = false
  private isInitialized = false
  private isPremium = false
  private retryCount = 0

  // SubscriptionProvider is the only writer: buying Pro mid-process must disarm an
  // interstitial preloaded while the user was still free.
  setPremium(isPremium: boolean): void {
    this.isPremium = isPremium
  }

  private ensureInitialized() {
    if (this.isInitialized) return
    if (this.isPremium) return
    if (!AD_INTERSTITIAL_ENABLED) return
    if (ADMOB_INTERSTITIAL_ID === null) return
    // An ad served ahead of the UMP form is the violation itself, not a missed
    // impression: it carries data the user has not agreed to hand over.
    if (!consentService.canRequestAds()) return
    if (!adsAllowedInEnvironment()) return
    this.isInitialized = true
    this.initializeInterstitial(ADMOB_INTERSTITIAL_ID)
  }

  // Call at app boot to start preloading before the first ad is shown.
  initialize(): void {
    this.ensureInitialized()
  }

  private initializeInterstitial(unitId: string) {
    const ad = InterstitialAd.createForAdRequest(unitId, {})

    const detachers = [
      ad.addAdEventListener(AdEventType.LOADED, () => {
        this.isAdLoaded = true
        this.isAdLoading = false
        this.retryCount = 0
      }),
      ad.addAdEventListener(AdEventType.CLOSED, () => {
        this.isAdLoaded = false
        this.preloadInterstitialAd()
      }),
      ad.addAdEventListener(AdEventType.ERROR, () => {
        this.isAdLoaded = false
        this.isAdLoading = false
        if (this.retryCount < MAX_LOAD_RETRIES) {
          const delay = Math.pow(2, this.retryCount) * BASE_RETRY_DELAY_MS
          this.retryCount++
          setTimeout(() => this.preloadInterstitialAd(), delay)
        }
      }),
    ]

    this.interstitialAd = ad
    this.detachInterstitial = () => detachers.forEach((detach) => detach())
    this.preloadInterstitialAd()
  }

  // An instance whose presentation failed is not trusted again: after a failure Android never
  // reported, the library still counts it as loaded and refuses to reload it.
  private replaceInterstitial() {
    this.detachInterstitial?.()
    this.interstitialAd = null
    this.detachInterstitial = null
    this.isAdLoaded = false
    this.isAdLoading = false
    this.retryCount = 0
    this.isInitialized = false
    this.ensureInitialized()
  }

  async preloadInterstitialAd() {
    if (!this.interstitialAd || this.isAdLoading || this.isAdLoaded) return

    try {
      this.isAdLoading = true
      this.interstitialAd.load()
    } catch (error) {
      console.warn('[AdService] Failed to preload interstitial:', error)
      this.isAdLoading = false
    }
  }

  private getExecutionsThreshold(): number {
    const daysSinceInstall = engagementService.getSessionContext()?.daysSinceInstall ?? 0

    return daysSinceInstall >= INTERSTITIAL_RAMP_UP_DAYS
      ? PROGRESSIVE_EXECUTIONS_THRESHOLD
      : INITIAL_EXECUTIONS_THRESHOLD
  }

  async shouldShowInterstitialAd(): Promise<boolean> {
    if (this.isPremium) return false
    if (!AD_INTERSTITIAL_ENABLED) return false
    // One automatic interruption per session, all types included: an ad never lands on top
    // of a paywall, nor in a session that already had its promo.
    if (!promoCoordinator.canPresentAutoPromo()) return false
    if (!consentService.canRequestAds()) return false
    this.ensureInitialized()

    const executionCount = adsStorage.getAdExecutionCount()
    const lastShown = adsStorage.getAdLastShown()
    const threshold = this.getExecutionsThreshold()

    const now = Date.now()
    const timeSinceLastAd = now - lastShown

    const shouldShow =
      executionCount >= threshold && timeSinceLastAd >= MIN_INTERVAL_MS && this.isAdLoaded

    return shouldShow
  }

  async recordExecution(): Promise<void> {
    this.ensureInitialized()
    const currentCount = adsStorage.getAdExecutionCount()
    adsStorage.setAdExecutionCount(currentCount + 1)
  }

  // Resolves once the ad is gone, true only if it was on screen: whatever follows an ad must
  // not open over it. Only an ad actually shown spends the cadence and the session's
  // interruption — even one that opened past the deadline — and the coordinator's flag comes
  // down on every path: left up, it would freeze every automatic promo for the session.
  async showInterstitialAd(): Promise<boolean> {
    if (this.isPremium) return false
    // Consent can change after the SDK started and preloaded: the privacy form stays reachable.
    if (!consentService.canRequestAds()) return false
    this.ensureInitialized()
    const ad = this.interstitialAd
    if (!this.isAdLoaded || !ad) return false

    let outcome: PresentationOutcome
    promoCoordinator.setInterstitialVisible(true)
    try {
      outcome = await presentFullScreenAd({
        ad,
        onEnd: (ending) => {
          if (ending === 'closed') this.spendSlot()
        },
      })
    } finally {
      promoCoordinator.setInterstitialVisible(false)
    }

    if (outcome !== 'closed') this.replaceInterstitial()
    return outcome === 'closed'
  }

  private spendSlot() {
    adsStorage.setAdExecutionCount(0)
    adsStorage.setAdLastShown(Date.now())
    promoCoordinator.markAutoPromoShown()
  }

  async resetExecutionCount(): Promise<void> {
    adsStorage.setAdExecutionCount(0)
  }

  async resetAllAdData(): Promise<void> {
    adsStorage.setAdExecutionCount(0)
    adsStorage.setAdLastShown(0)
  }
}

export const AdService = new AdServiceClass()
