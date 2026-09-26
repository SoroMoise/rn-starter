import { useEffect } from 'react'
import { I18nManager, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'

const TRACK_WIDTH = 46
const TRACK_HEIGHT = 23
const KNOB_SIZE = 16
const KNOB_INSET = 3
const KNOB_TRAVEL = TRACK_WIDTH - KNOB_SIZE - KNOB_INSET * 2

// The knob sits at the track's start edge, and a transform is never mirrored in RTL.
const INLINE_DIRECTION = I18nManager.isRTL ? -1 : 1

const SPRING = { damping: 20, stiffness: 400, mass: 0.55 }

// Decoration only: the row that hosts it is the touch target and carries the switch role, so the
// two can never disagree about what a tap does.
export function AppSwitch({ value }: { value: boolean }) {
  const offset = useSharedValue(value ? KNOB_TRAVEL : 0)

  useEffect(() => {
    offset.value = withSpring(value ? KNOB_TRAVEL : 0, SPRING)
  }, [value, offset])

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: INLINE_DIRECTION * offset.value }],
  }))

  return (
    <View
      className={value ? 'bg-brand-blue' : 'bg-gray-300 dark:bg-gray-600'}
      style={{
        width: TRACK_WIDTH,
        height: TRACK_HEIGHT,
        borderRadius: TRACK_HEIGHT / 2,
        padding: KNOB_INSET,
        flexShrink: 0,
      }}>
      <Animated.View
        style={[
          {
            width: KNOB_SIZE,
            height: KNOB_SIZE,
            borderRadius: KNOB_SIZE / 2,
            backgroundColor: '#ffffff',
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.3,
            shadowRadius: 3,
            elevation: 2,
          },
          knobStyle,
        ]}
      />
    </View>
  )
}
