import React from 'react'
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
      {children}
    </SafeAreaView>
  )
}
