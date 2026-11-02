import { AD_REQUEST_OPTIONS, ADMOB_REWARDED_ID } from '@/constants/admob'
import { adsAllowedInEnvironment } from '@/services/api/adEnvironment'
import { reportAdFailure } from '@/services/api/adFailures'
import { consentService } from '@/services/api/consentService'
import { presentFullScreenAd } from '@/services/api/fullScreenAd'
import { AdEventType, RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads'

export type RewardedOutcome = 'earned' | 'dismissed' | 'failed'

export type RewardedPlacement = 'settings'

const UNIT_BY_PLACEMENT: Record<RewardedPlacement, string | null> = {
  settings: ADMOB_REWARDED_ID,
}

type RewardedSlot = {
  ad: RewardedAd
  detach: () => void
  isLoaded: boolean
  isLoading: boolean
}

class RewardedAdServiceClass {
  private slots = new Map<string, RewardedSlot>()

  private slotFor({ placement }: { placement: RewardedPlacement }): RewardedSlot | null {
    const unitId = UNIT_BY_PLACEMENT[placement]
    if (unitId === null) return null
    if (!adsAllowedInEnvironment()) return null
    if (!consentService.canRequestAds()) return null

    const existing = this.slots.get(unitId)
    if (existing) return existing

    const ad = RewardedAd.createForAdRequest(unitId, AD_REQUEST_OPTIONS)
    const slot: RewardedSlot = { ad, detach: () => {}, isLoaded: false, isLoading: false }

    const detachers = [
      ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        slot.isLoaded = true
        slot.isLoading = false
      }),
      ad.addAdEventListener(AdEventType.CLOSED, () => {
        slot.isLoaded = false
        this.load(slot)
      }),
      ad.addAdEventListener(AdEventType.ERROR, (error) => {
        reportAdFailure({ error, source: 'rewarded_load' })
        slot.isLoaded = false
        slot.isLoading = false
      }),
    ]
    slot.detach = () => detachers.forEach((detach) => detach())

    this.slots.set(unitId, slot)
    this.load(slot)
    return slot
  }

  private load(slot: RewardedSlot) {
    if (slot.isLoading || slot.isLoaded) return

    try {
      slot.isLoading = true
      slot.ad.load()
    } catch (error) {
      reportAdFailure({ error, source: 'rewarded_preload' })
      slot.isLoading = false
    }
  }

  private replaceSlot({ placement, slot }: { placement: RewardedPlacement; slot: RewardedSlot }) {
    slot.detach()
    this.slots.delete(slot.ad.adUnitId)
    this.slotFor({ placement })
  }

  preload({ placement }: { placement: RewardedPlacement }): void {
    const slot = this.slotFor({ placement })
    if (slot) this.load(slot)
  }

  isReady({ placement }: { placement: RewardedPlacement }): boolean {
    return this.slotFor({ placement })?.isLoaded === true
  }

  async show({
    placement,
    onRewarded,
  }: {
    placement: RewardedPlacement
    onRewarded: () => void
  }): Promise<RewardedOutcome> {
    if (!consentService.canRequestAds()) return 'failed'
    const slot = this.slotFor({ placement })
    if (!slot?.isLoaded) return 'failed'

    let hasRewarded = false
    const removeEarnedListener = slot.ad.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        hasRewarded = true
        onRewarded()
      }
    )

    const outcome = await presentFullScreenAd({
      ad: slot.ad,
      source: 'rewarded_show',
      onEnd: removeEarnedListener,
    })
    if (outcome !== 'closed') this.replaceSlot({ placement, slot })
    if (hasRewarded) return 'earned'
    return outcome === 'closed' ? 'dismissed' : 'failed'
  }
}

export const RewardedAdService = new RewardedAdServiceClass()
