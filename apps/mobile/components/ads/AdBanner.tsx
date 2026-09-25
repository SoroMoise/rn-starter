import { useAdsConsent } from '@/hooks/useAdsConsent'
import { usePremium } from '@/hooks/usePremium'
import { useStageActive } from '@/hooks/useStageActive'
import { useTabBarPadding } from '@/hooks/useTabBarPadding'
import { useAdFree } from '@/providers/AdFreeProvider'
import { adsAllowedInEnvironment } from '@/services/api/adEnvironment'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads'

interface AdBannerProps {
  adBannerId: string | null
  screenName: string
  enabled?: boolean
}

export function AdBanner({ adBannerId, screenName, enabled = true }: AdBannerProps) {
  const { isAdFreeActive } = useAdFree()
  const { isPremium, isInitialized } = usePremium()
  const { canRequestAds } = useAdsConsent()
  // A BannerAd left refreshing under the top of the stack, or rebuilt by an
  // in-screen toggle, is impression inflation — the same offence as serving the
  // pre-launch crawler. One mount per visit, unmounted the moment the screen is
  // no longer the one in front of the user.
  const isStageActive = useStageActive()
  const tabBarPadding = useTabBarPadding() + 8

  if (!enabled || adBannerId === null || !isInitialized || isAdFreeActive || isPremium) return null
  if (!canRequestAds || !adsAllowedInEnvironment()) return null
  if (!isStageActive) return null

  return (
    <View style={[styles.container, { bottom: tabBarPadding }]} key={`ad-banner-${screenName}`}>
      <BannerAd unitId={adBannerId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
})
