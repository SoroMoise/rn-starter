import { UI_CONFIG } from '@/constants/config'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type ScreenContainerProps = {
  children: React.ReactNode
  className?: string
}

const EDGES = ['top', 'left', 'right'] as const

export function ScreenContainer({ children, className }: ScreenContainerProps) {
  return (
    <SafeAreaView
      edges={EDGES}
      className={`flex-1 bg-gray-50 dark:bg-gray-900${className ? ` ${className}` : ''}`}>
      <View className="w-full flex-1 self-center" style={styles.content}>
        {children}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  content: {
    maxWidth: UI_CONFIG.MAX_CONTENT_WIDTH,
  },
})
