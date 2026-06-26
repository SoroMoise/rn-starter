import { useThemedColor } from '@hooks/useThemedColor'
import React, { useEffect } from 'react'
import { View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

const PULSE_DURATION = 700

export const TargetCurrencyRowSkeleton = React.memo(function TargetCurrencyRowSkeleton() {
  const isDark = useThemedColor()
  const pulse = useSharedValue(0.4)

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: PULSE_DURATION, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: PULSE_DURATION, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    )
    return () => {
      pulse.value = 0.4
    }
  }, [pulse])

  const animatedStyle = useAnimatedStyle(() => ({ opacity: pulse.value }))

  const baseColor = isDark ? '#374151' : '#e5e7eb'
  const baseBg = isDark ? '#1f2937' : '#ffffff'

  const block = ({
    width,
    height,
    radius = 6,
  }: {
    width: number | `${number}%`
    height: number
    radius?: number
  }) => (
    <Animated.View
      style={[{ width, height, backgroundColor: baseColor, borderRadius: radius }, animatedStyle]}
    />
  )

  return (
    <View
      style={{
        marginHorizontal: 12,
        backgroundColor: baseBg,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
      }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <View style={{ marginRight: 10 }}>{block({ width: 14, height: 14, radius: 3 })}</View>
      <View style={{ marginRight: 12 }}>
        <Animated.View
          style={[
            { width: 24, height: 24, borderRadius: 12, backgroundColor: baseColor },
            animatedStyle,
          ]}
        />
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        {block({ width: 90, height: 11 })}
        {block({ width: 140, height: 9 })}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        {block({ width: 70, height: 14 })}
        {block({ width: 40, height: 9 })}
      </View>
    </View>
  )
})
