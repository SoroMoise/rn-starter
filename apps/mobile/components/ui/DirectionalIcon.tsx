import Ionicons from '@expo/vector-icons/Ionicons'
import React from 'react'
import type { ComponentProps } from 'react'
import { I18nManager } from 'react-native'

export function DirectionalIcon({ style, ...props }: ComponentProps<typeof Ionicons>) {
  return (
    <Ionicons {...props} style={[style, I18nManager.isRTL && { transform: [{ scaleX: -1 }] }]} />
  )
}
