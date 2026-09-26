import { UI_CONFIG } from '@/constants/config'
import { useAdPlacementActive } from '@/hooks/useAdPlacementActive'
import { useStageActive } from '@/hooks/useStageActive'
import { useTabBarPadding } from '@/hooks/useTabBarPadding'
import React from 'react'
import { StyleSheet, View, useWindowDimensions } from 'react-native'
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface AdBannerProps {
  adBannerId: string | null
  screenName: string
  enabled?: boolean
}

export function AdBanner({ adBannerId, screenName, enabled = true }: AdBannerProps) {
  const isPlacementActive = useAdPlacementActive({ unitId: adBannerId, enabled })
  // A BannerAd left refreshing under the top of the stack, or rebuilt by an
  // in-screen toggle, is impression inflation — the same offence as serving the
  // pre-launch crawler. One mount per visit, unmounted the moment the screen is
  // no longer the one in front of the user.
  const isStageActive = useStageActive()
  const tabBarPadding = useTabBarPadding() + 8
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  // An anchored banner is as wide as the device unless told otherwise. In ScreenContainer's column
  // a wider ad hangs past its container, where Android delivers no touch: it gets the column's width.
  const bannerWidth = Math.min(UI_CONFIG.MAX_CONTENT_WIDTH, width - insets.left - insets.right)

  if (!isPlacementActive || !isStageActive || adBannerId === null) return null

  return (
    <View style={[styles.container, { bottom: tabBarPadding }]} key={`ad-banner-${screenName}`}>
      <BannerAd
        unitId={adBannerId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        width={bannerWidth}
      />
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
