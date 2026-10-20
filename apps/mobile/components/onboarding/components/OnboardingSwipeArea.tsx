import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { I18nManager } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'

const ACTIVE_OFFSET_X = 20
const FAIL_OFFSET_Y = 15
const SWIPE_DISTANCE = 60
const SWIPE_VELOCITY = 600
const DRAG_FOLLOW = 0.25

type OnboardingSwipeAreaProps = {
  onForward: () => void
  onBack: () => void
  children: ReactNode
}

export function OnboardingSwipeArea({ onForward, onBack, children }: OnboardingSwipeAreaProps) {
  const offset = useSharedValue(0)

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-ACTIVE_OFFSET_X, ACTIVE_OFFSET_X])
        .failOffsetY([-FAIL_OFFSET_Y, FAIL_OFFSET_Y])
        .runOnJS(true)
        .onUpdate((event) => {
          offset.value = event.translationX * DRAG_FOLLOW
        })
        .onEnd((event, success) => {
          offset.value = withSpring(0, { damping: 20, stiffness: 220 })
          if (!success) return
          const forwardSign = I18nManager.isRTL ? 1 : -1
          const travel = event.translationX * forwardSign
          const speed = event.velocityX * forwardSign
          if (travel > SWIPE_DISTANCE || (travel > 0 && speed > SWIPE_VELOCITY)) onForward()
          else if (travel < -SWIPE_DISTANCE || (travel < 0 && speed < -SWIPE_VELOCITY)) onBack()
        }),
    [offset, onForward, onBack]
  )

  const followStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }))

  return (
    <GestureDetector gesture={pan}>
      <Animated.View collapsable={false} className="flex-1" style={followStyle}>
        {children}
      </Animated.View>
    </GestureDetector>
  )
}
