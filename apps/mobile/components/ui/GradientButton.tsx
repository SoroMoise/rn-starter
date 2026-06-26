import { LinearGradient } from 'expo-linear-gradient'
import React from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'

function extractBorderRadius(style: StyleProp<ViewStyle>): number | undefined {
  if (!style) return undefined
  const flat = StyleSheet.flatten(style)
  return typeof flat?.borderRadius === 'number' ? flat.borderRadius : undefined
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
  const borderRadius = extractBorderRadius(style)

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || isLoading}
      style={style}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: disabled || isLoading }}>
      {({ pressed }) => (
        <View
          style={[
            styles.container,
            borderRadius !== undefined && { borderRadius },
            pressed && {
              ...(pressOpacity !== 0 && { opacity: pressOpacity }),
              ...(pressScale !== 0 && { transform: [{ scale: pressScale }] }),
            },
            (disabled || isLoading) && styles.disabled,
          ]}>
          <LinearGradient
            colors={colors}
            start={start}
            end={end}
            style={[styles.gradient, gradientStyle]}>
            {isLoading ? <ActivityIndicator size="small" color="#ffffff" /> : children}
          </LinearGradient>
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  disabled: {
    opacity: 0.5,
  },
})
