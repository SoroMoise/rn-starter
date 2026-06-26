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

export const StatisticsChartSkeleton = React.memo(function StatisticsChartSkeleton() {
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
  const blockColor = isDark ? '#374151' : '#e5e7eb'
  const cardBg = isDark ? '#1f2937' : '#ffffff'

  const block = (height: number, width: number | `${number}%` = '100%') => (
    <Animated.View
      style={[{ width, height, backgroundColor: blockColor, borderRadius: 8 }, animatedStyle]}
    />
  )

  return (
    <View
      style={{ marginTop: 12, gap: 12 }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, gap: 10 }}>
        {block(180)}
        {block(14, '40%')}
      </View>
      <View
        style={{
          backgroundColor: cardBg,
          borderRadius: 16,
          padding: 16,
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 12,
        }}>
        {block(64, '45%')}
        {block(64, '45%')}
        {block(64, '45%')}
        {block(64, '45%')}
      </View>
    </View>
  )
})
