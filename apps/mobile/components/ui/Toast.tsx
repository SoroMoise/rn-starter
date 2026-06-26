import { ThemedText } from '@/components/ui/ThemedText'
import { triggerError, triggerSuccess, triggerWarning } from '@/utils/haptics'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useThemedColor } from '@hooks/useThemedColor'
import React, { ComponentProps, useCallback, useEffect, useRef } from 'react'
import { useWindowDimensions, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { scheduleOnRN } from 'react-native-worklets'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastProps {
  message: string
  type?: ToastType
  visible: boolean
  onHide: () => void
  duration?: number
}

const SPRING_CONFIG = { damping: 25, stiffness: 300 }

export function Toast({ message, type = 'success', visible, onHide, duration = 3000 }: ToastProps) {
  const insets = useSafeAreaInsets()
  const isDark = useThemedColor()
  const { width: screenWidth } = useWindowDimensions()

  const translateY = useSharedValue(100)
  const translateX = useSharedValue(0)
  const opacity = useSharedValue(0)
  const scale = useSharedValue(1)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startTimer = useCallback(() => {
    timerRef.current = setTimeout(() => {
      translateY.value = withSpring(100, { damping: 20, stiffness: 300 })
      opacity.value = withTiming(0, { duration: 200 }, (finished) => {
        if (finished) scheduleOnRN(onHide)
      })
    }, duration)
  }, [duration, onHide, opacity, translateY])

  useEffect(() => {
    if (!visible) return

    cancelTimer()
    translateX.value = 0
    scale.value = 1
    translateY.value = 100

    if (type === 'error') triggerError()
    else if (type === 'warning') triggerWarning()
    else if (type === 'success') triggerSuccess()

    translateY.value = withSpring(0, { damping: 30, stiffness: 250 })
    opacity.value = withTiming(1, { duration: 300 })

    startTimer()

    return () => cancelTimer()
  }, [visible, type, cancelTimer, startTimer, opacity, scale, translateX, translateY])

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      runOnJS(cancelTimer)()
    })
    .onChange((event) => {
      translateX.value = event.translationX
      translateY.value = Math.max(0, event.translationY)
      const dist = Math.sqrt(event.translationX ** 2 + event.translationY ** 2)
      scale.value = Math.max(0.93, 1 - dist / 1800)
    })
    .onFinalize((event) => {
      const horizDistThreshold = screenWidth * 0.35
      const shouldDismissRight = event.translationX > horizDistThreshold || event.velocityX > 400
      const shouldDismissLeft = event.translationX < -horizDistThreshold || event.velocityX < -400
      const shouldDismissDown = event.translationY > 60 || event.velocityY > 300

      if (shouldDismissRight) {
        scale.value = withSpring(1, SPRING_CONFIG)
        translateX.value = withSpring(screenWidth * 1.3, SPRING_CONFIG)
        opacity.value = withTiming(0, { duration: 220 }, (finished) => {
          if (finished) scheduleOnRN(onHide)
        })
      } else if (shouldDismissLeft) {
        scale.value = withSpring(1, SPRING_CONFIG)
        translateX.value = withSpring(-screenWidth * 1.3, SPRING_CONFIG)
        opacity.value = withTiming(0, { duration: 220 }, (finished) => {
          if (finished) scheduleOnRN(onHide)
        })
      } else if (shouldDismissDown) {
        scale.value = withSpring(1, SPRING_CONFIG)
        translateY.value = withSpring(150, { damping: 20, stiffness: 300 })
        opacity.value = withTiming(0, { duration: 220 }, (finished) => {
          if (finished) scheduleOnRN(onHide)
        })
      } else {
        translateX.value = withSpring(0, SPRING_CONFIG)
        translateY.value = withSpring(0, { damping: 20, stiffness: 250 })
        scale.value = withSpring(1, SPRING_CONFIG)
        runOnJS(startTimer)()
      }
    })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }))

  if (!visible) return null

  type IoniconsName = ComponentProps<typeof Ionicons>['name']

  const getIconConfig = (): { name: IoniconsName; color: string } => {
    switch (type) {
      case 'success':
        return { name: 'checkmark-circle', color: '#10b981' }
      case 'error':
        return { name: 'close-circle', color: '#ef4444' }
      case 'warning':
        return { name: 'warning', color: '#f59e0b' }
      case 'info':
        return { name: 'information-circle', color: '#3b82f6' }
      default:
        return { name: 'checkmark-circle', color: '#10b981' }
    }
  }

  const iconConfig = getIconConfig()

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          animatedStyle,
          {
            position: 'absolute',
            bottom: insets.bottom + 20,
            left: 16,
            right: 16,
            zIndex: 9999,
          },
        ]}>
        <View
          className={`flex-row items-center rounded-2xl px-5 py-4 shadow-2xl ${
            isDark ? 'border border-gray-700 bg-gray-800/95' : 'border border-gray-200 bg-white/95'
          }`}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 16,
            elevation: 12,
          }}>
          <View>
            <Ionicons name={iconConfig.name} size={28} color={iconConfig.color} />
          </View>
          <ThemedText variant="body" weight="medium" className="ml-3 flex-1">
            {message}
          </ThemedText>
        </View>
      </Animated.View>
    </GestureDetector>
  )
}
