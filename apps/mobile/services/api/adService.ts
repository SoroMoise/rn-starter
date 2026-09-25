import { AD_INTERSTITIAL_ENABLED, ADMOB_INTERSTITIAL_ID } from '@/constants/admob'
import { adsAllowedInEnvironment } from '@/services/api/adEnvironment'
import { consentService } from '@/services/api/consentService'
import { engagementService } from '@/services/api/engagementService'
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
  private isAdLoaded = false
  private isAdLoading = false
  private isInitialized = false
  private retryCount = 0

  private ensureInitialized() {
    if (this.isInitialized) return
    if (!AD_INTERSTITIAL_ENABLED) return
    // An ad served ahead of the UMP form is the violation itself, not a missed
    // impression: it carries data the user has not agreed to hand over.
    if (!consentService.canRequestAds()) return
    if (!adsAllowedInEnvironment()) return
    this.isInitialized = true
    this.initializeInterstitial()
  }

  // Call at app boot to start preloading before the first ad is shown.
  initialize(): void {
    this.ensureInitialized()
  }

  private initializeInterstitial() {
    this.interstitialAd = InterstitialAd.createForAdRequest(ADMOB_INTERSTITIAL_ID, {})

    this.interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
      this.isAdLoaded = true
      this.isAdLoading = false
      this.retryCount = 0
    })

    this.interstitialAd.addAdEventListener(AdEventType.OPENED, () => {})

    this.interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      this.isAdLoaded = false
      this.preloadInterstitialAd()
    })

    this.interstitialAd.addAdEventListener(AdEventType.ERROR, () => {
      this.isAdLoaded = false
      this.isAdLoading = false
      if (this.retryCount < MAX_LOAD_RETRIES) {
        const delay = Math.pow(2, this.retryCount) * BASE_RETRY_DELAY_MS
        this.retryCount++
        setTimeout(() => this.preloadInterstitialAd(), delay)
      }
    })

    this.interstitialAd.addAdEventListener(AdEventType.PAID, () => {})

    this.preloadInterstitialAd()
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
    if (!AD_INTERSTITIAL_ENABLED) return false
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

  async showInterstitialAd(): Promise<void> {
    this.ensureInitialized()
    if (!this.isAdLoaded || !this.interstitialAd) {
      return
    }

    try {
      await this.interstitialAd.show()
      adsStorage.setAdExecutionCount(0)
      adsStorage.setAdLastShown(Date.now())
    } catch (error) {
      console.warn('[AdService] Failed to show interstitial:', error)
    }
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
