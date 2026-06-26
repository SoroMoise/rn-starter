import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

type ScreenContainerProps = {
  children: React.ReactNode
  className?: string
}

export function ScreenContainer({ children, className }: ScreenContainerProps) {
  return (
    <SafeAreaView
      className={`flex-1 bg-gray-50 dark:bg-gray-900${className ? ` ${className}` : ''}`}>
      {children}
    </SafeAreaView>
  )
}
