import { ADMOB_REWARDED_ID } from '@/constants/admob'
import { adsAllowedInEnvironment } from '@/services/api/adEnvironment'
import { consentService } from '@/services/api/consentService'
import { presentFullScreenAd } from '@/services/api/fullScreenAd'
import { AdEventType, RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads'

// A presentation that failed is not a refusal: only a user who closed the video early is
// someone who declined the reward.
export type RewardedOutcome = 'earned' | 'dismissed' | 'failed'

class RewardedAdServiceClass {
  private rewardedAd: RewardedAd | null = null
  private detachRewarded: (() => void) | null = null
  private isAdLoaded = false
  private isAdLoading = false
  private isInitialized = false

  private ensureInitialized() {
    if (this.isInitialized) return
    if (ADMOB_REWARDED_ID === null) return
    if (!consentService.canRequestAds()) return
    if (!adsAllowedInEnvironment()) return
    this.isInitialized = true
    this.initializeRewarded(ADMOB_REWARDED_ID)
  }

  private initializeRewarded(unitId: string) {
    const ad = RewardedAd.createForAdRequest(unitId, {})

    const detachers = [
      ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        this.isAdLoaded = true
        this.isAdLoading = false
      }),
      ad.addAdEventListener(AdEventType.CLOSED, () => {
        this.isAdLoaded = false
        this.preloadRewardedAd()
      }),
      ad.addAdEventListener(AdEventType.ERROR, () => {
        this.isAdLoaded = false
        this.isAdLoading = false
      }),
    ]

    this.rewardedAd = ad
    this.detachRewarded = () => detachers.forEach((detach) => detach())
    this.preloadRewardedAd()
  }

  // The library still counts an ad that never opened as loaded and refuses to reload that
  // instance, so the only way back to a fresh ad is a new one.
  private replaceRewarded() {
    this.detachRewarded?.()
    this.rewardedAd = null
    this.detachRewarded = null
    this.isAdLoaded = false
    this.isAdLoading = false
    this.isInitialized = false
    this.ensureInitialized()
  }

  async preloadRewardedAd() {
    this.ensureInitialized()
    if (!this.rewardedAd || this.isAdLoading || this.isAdLoaded) return

    try {
      this.isAdLoading = true
      this.rewardedAd.load()
    } catch (error) {
      console.warn('[RewardedAdService] Failed to preload:', error)
      this.isAdLoading = false
    }
  }

  isRewardedAdReady(): boolean {
    return this.isAdLoaded
  }

  async showRewardedAd(onRewarded: () => void): Promise<RewardedOutcome> {
    // Consent can change after the SDK started and preloaded: the privacy form stays reachable.
    if (!consentService.canRequestAds()) return 'failed'
    this.ensureInitialized()
    const ad = this.rewardedAd
    if (!this.isAdLoaded || !ad) return 'failed'

    let hasRewarded = false
    const removeEarnedListener = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      hasRewarded = true
      onRewarded()
    })

    try {
      const outcome = await presentFullScreenAd(ad)
      if (outcome === 'never_opened') this.replaceRewarded()
      if (hasRewarded) return 'earned'
      return outcome === 'closed' ? 'dismissed' : 'failed'
    } finally {
      removeEarnedListener()
    }
  }
}

export const RewardedAdService = new RewardedAdServiceClass()
