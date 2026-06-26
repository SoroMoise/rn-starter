import { ADMOB_REWARDED_ID } from '@/constants/admob'
import { AdEventType, RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads'

class RewardedAdServiceClass {
  private rewardedAd: RewardedAd | null = null
  private isAdLoaded = false
  private isAdLoading = false
  private isInitialized = false

  private ensureInitialized() {
    if (this.isInitialized) return
    this.isInitialized = true
    this.initializeRewarded()
  }

  private initializeRewarded() {
    this.rewardedAd = RewardedAd.createForAdRequest(ADMOB_REWARDED_ID, {})

    this.rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      this.isAdLoaded = true
      this.isAdLoading = false
    })

    this.rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {})

    this.rewardedAd.addAdEventListener(AdEventType.OPENED, () => {})

    this.rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
      this.isAdLoaded = false
      this.preloadRewardedAd()
    })

    this.rewardedAd.addAdEventListener(AdEventType.ERROR, () => {
      this.isAdLoaded = false
      this.isAdLoading = false
    })

    this.rewardedAd.addAdEventListener(AdEventType.PAID, () => {})

    this.preloadRewardedAd()
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

  async showRewardedAd(onRewarded: () => void): Promise<boolean> {
    this.ensureInitialized()
    if (!this.isAdLoaded || !this.rewardedAd) {
      return false
    }

    return new Promise((resolve) => {
      let hasRewarded = false
      let settled = false

      const settle = (value: boolean) => {
        if (settled) return
        settled = true
        removeEarnedListener()
        removeClosedListener()
        removeErrorListener()
        resolve(value)
      }

      const removeEarnedListener = this.rewardedAd!.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        () => {
          hasRewarded = true
          onRewarded()
        }
      )

      const removeClosedListener = this.rewardedAd!.addAdEventListener(AdEventType.CLOSED, () => {
        settle(hasRewarded)
      })

      // Render failure or ad expiry during display: CLOSED never fires, so
      // without this the promise hangs forever and the per-show listeners leak.
      const removeErrorListener = this.rewardedAd!.addAdEventListener(AdEventType.ERROR, () => {
        settle(false)
      })

      try {
        this.rewardedAd!.show()
      } catch (error) {
        console.warn('[RewardedAdService] Failed to show ad:', error)
        settle(false)
      }
    })
  }
}

export const RewardedAdService = new RewardedAdServiceClass()
