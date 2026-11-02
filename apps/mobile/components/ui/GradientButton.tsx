import { LinearGradient } from 'expo-linear-gradient'
import React, { useState } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'

const SIZED_PADDING_VERTICAL = 12

function asMinimumHeight(style: StyleProp<ViewStyle>): {
  style: StyleProp<ViewStyle>
  minHeight: number | undefined
} {
  const flat = StyleSheet.flatten(style)
  if (typeof flat?.height !== 'number') return { style, minHeight: undefined }
  const { height, ...rest } = flat
  return { style: [rest, { minHeight: height }], minHeight: height }
}

interface GradientButtonProps {
  onPress: () => void | Promise<void>
  colors: readonly [string, string, ...string[]]
  disabled?: boolean
  isLoading?: boolean
  pressScale?: number
  pressOpacity?: number
  start?: { x: number; y: number }
  end?: { x: number; y: number }
  style?: StyleProp<ViewStyle>
  gradientStyle?: StyleProp<ViewStyle>
  accessibilityLabel?: string
  children: React.ReactNode
}

export function GradientButton({
  onPress,
  colors,
  disabled = false,
  isLoading = false,
  pressScale = 0.98,
  pressOpacity = 0.9,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 0 },
  style,
  gradientStyle,
  accessibilityLabel,
  children,
}: GradientButtonProps) {
  const sized = asMinimumHeight(style)
  const isInactive = disabled || isLoading
  const [isPressed, setPressed] = useState(false)

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={isInactive}
      className="justify-center overflow-hidden rounded-[0.875rem]"
      style={[
        sized.style,
        isInactive && styles.inactive,
        isPressed && {
          ...(pressOpacity !== 0 && { opacity: pressOpacity }),
          ...(pressScale !== 0 && { transform: [{ scale: pressScale }] }),
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isInactive, busy: isLoading }}>
      <LinearGradient colors={colors} start={start} end={end} style={StyleSheet.absoluteFill} />
      <View
        style={[
          styles.content,
          sized.minHeight !== undefined && {
            minHeight: sized.minHeight,
            paddingVertical: SIZED_PADDING_VERTICAL,
          },
          gradientStyle,
        ]}>
        {isLoading ? <ActivityIndicator size="small" color="#ffffff" /> : children}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  inactive: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
})
