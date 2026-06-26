import { useTabBarPadding } from '@/hooks/useTabBarPadding'
import { usePremium } from '@/hooks/usePremium'
import { useAdFree } from '@/providers/AdFreeProvider'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads'

interface AdBannerProps {
  adBannerId: string
  screenName: string
  enabled?: boolean
}

export function AdBanner({ adBannerId, screenName, enabled = true }: AdBannerProps) {
  const { isAdFreeActive } = useAdFree()
  const { isPremium, isInitialized } = usePremium()
  const tabBarPadding = useTabBarPadding() + 8

  if (!enabled || !isInitialized || isAdFreeActive || isPremium) return null

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
