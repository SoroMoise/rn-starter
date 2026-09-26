import { UI_CONFIG } from '@/constants/config'
import { useWindowDimensions } from 'react-native'

export interface ResponsiveLayout {
  width: number
  height: number
  contentWidth: number
  gutter: number
  isLargeScreen: boolean
}

export function useResponsiveLayout(): ResponsiveLayout {
  const { width, height } = useWindowDimensions()
  const contentWidth = Math.min(width, UI_CONFIG.MAX_CONTENT_WIDTH)

  return {
    width,
    height,
    contentWidth,
    gutter: (width - contentWidth) / 2,
    isLargeScreen: width > contentWidth,
  }
}
