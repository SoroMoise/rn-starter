import Ionicons from '@expo/vector-icons/Ionicons'
import React from 'react'
import type { ComponentProps } from 'react'
import { I18nManager } from 'react-native'

// RN mirrors layout in RTL but never glyphs: directional icons (chevrons,
// arrows) must be flipped manually or they point "backwards" in Arabic.
export function DirectionalIcon({ style, ...props }: ComponentProps<typeof Ionicons>) {
  return (
    <Ionicons {...props} style={[style, I18nManager.isRTL && { transform: [{ scaleX: -1 }] }]} />
  )
}
