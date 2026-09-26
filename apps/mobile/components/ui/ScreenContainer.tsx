import { UI_CONFIG } from '@/constants/config'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type ScreenContainerProps = {
  children: React.ReactNode
  className?: string
}

// `PremiumTabBar` is absolute and already pads itself by the bottom inset, so the
// scene must not add it again: padding both pushed everything anchored to the
// bottom — the ad banner, a keypad — a whole navigation bar clear of the tab bar.
// Anything anchored down there measures from the window and adds the inset
// itself, through `useTabBarPadding`.
const EDGES = ['top', 'left', 'right'] as const

export function ScreenContainer({ children, className }: ScreenContainerProps) {
  return (
    <SafeAreaView
      edges={EDGES}
      className={`flex-1 bg-gray-50 dark:bg-gray-900${className ? ` ${className}` : ''}`}>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  // A max rather than a measured width: below MAX_CONTENT_WIDTH the cap never binds, so a phone
  // resolves to the exact box it did before, with no dimension read and no re-render on resize.
  content: {
    flex: 1,
    width: '100%',
    maxWidth: UI_CONFIG.MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
})
