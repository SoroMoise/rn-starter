import { triggerLight } from '@utils/haptics'
import { computePartialY, resolveSnapDecision } from '@utils/snapBottomSheet'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Platform, useWindowDimensions } from 'react-native'
import { Gesture } from 'react-native-gesture-handler'
import type { SharedValue } from 'react-native-reanimated'
import {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'

const SPRING_OPEN = { damping: 22, stiffness: 200, mass: 0.9 }
const SPRING_SNAP = { damping: 28, stiffness: 280, mass: 0.8 }
const SPRING_BOUNCE = { damping: 35, stiffness: 420, mass: 0.7 }

export function useSheetSnap({
  visible,
  initialSnap,
  dragLock,
  onClose,
}: {
  visible: boolean
  initialSnap?: number
  dragLock?: SharedValue<boolean>
  onClose: () => void
}) {
  const { height } = useWindowDimensions()
  const screenHeightRef = useRef(height)
  screenHeightRef.current = height

  const screenHeightSv = useSharedValue(height)
  useEffect(() => {
    screenHeightSv.value = height
  }, [height]) // eslint-disable-line react-hooks/exhaustive-deps

  const hasSnapPoints = initialSnap != null
  const isIOS = Platform.OS === 'ios'

  const partialYSv = useSharedValue(hasSnapPoints ? computePartialY(height, initialSnap!) : 0)
  useEffect(() => {
    if (hasSnapPoints) partialYSv.value = computePartialY(height, initialSnap!)
  }, [height]) // eslint-disable-line react-hooks/exhaustive-deps

  const dragBaseY = useSharedValue(0)
  const snapIndexSv = useSharedValue<0 | 1>(hasSnapPoints ? 0 : 1)
  const [snapIndex, setSnapIndex] = useState<0 | 1>(hasSnapPoints ? 0 : 1)

  const translateY = useSharedValue(height)
  const overlayOpacity = useSharedValue(0)
  const scrollY = useSharedValue(0)
  // Distinguishes an actual drag from a pan that only fires because scrolled content moved.
  const sheetMoved = useSharedValue(false)
  const beganAtTop = useSharedValue(true)

  const isClosing = useRef(false)

  useEffect(() => {
    if (visible) {
      isClosing.current = false
      scrollY.value = 0

      if (hasSnapPoints) {
        const pY = computePartialY(screenHeightRef.current, initialSnap!)
        partialYSv.value = pY
        snapIndexSv.value = 0
        setSnapIndex(0)
        translateY.value = screenHeightRef.current
        translateY.value = withSpring(pY, SPRING_OPEN)
      } else {
        translateY.value = screenHeightRef.current
        overlayOpacity.value = 0
        translateY.value = withSpring(0, SPRING_OPEN)
        overlayOpacity.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.cubic) })
      }
    }
  }, [visible]) // eslint-disable-line react-hooks/exhaustive-deps

  const close = useCallback(() => {
    if (isClosing.current) return
    isClosing.current = true
    triggerLight()
    overlayOpacity.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) })
    translateY.value = withTiming(
      screenHeightRef.current,
      { duration: 300, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) scheduleOnRN(onClose)
      }
    )
  }, [onClose, translateY, overlayOpacity])

  const snapToFull = useCallback(() => {
    snapIndexSv.value = 1
    setSnapIndex(1)
    translateY.value = withSpring(0, SPRING_SNAP)
  }, [snapIndexSv, translateY])

  const snapToPartial = useCallback(() => {
    snapIndexSv.value = 0
    setSnapIndex(0)
    translateY.value = withSpring(partialYSv.value, SPRING_SNAP)
  }, [snapIndexSv, partialYSv, translateY])

  const panGesture = useMemo(() => {
    let gesture = Gesture.Pan()
      .activeOffsetY(hasSnapPoints ? [-15, 15] : 10)
      .onBegin(() => {
        dragBaseY.value = snapIndexSv.value === 1 ? 0 : partialYSv.value
        sheetMoved.value = false
        beganAtTop.value = scrollY.value <= 0
      })
      .onUpdate((e) => {
        if (dragLock?.value) return
        if (hasSnapPoints) {
          const rawY = dragBaseY.value + e.translationY
          const clampedY = rawY < 0 ? rawY * 0.25 : rawY
          if (snapIndexSv.value === 1 && !beganAtTop.value && e.translationY > 0) return
          sheetMoved.value = Math.abs(e.translationY) > 5
          translateY.value = clampedY
        } else {
          const dy = Math.max(0, e.translationY)
          if (!beganAtTop.value && dy > 0) return
          sheetMoved.value = dy > 0
          translateY.value = dy
          overlayOpacity.value = Math.min(1, Math.max(0, 1 - (dy / screenHeightSv.value) * 1.5))
        }
      })
      .onEnd((e) => {
        if (!sheetMoved.value) {
          const base = hasSnapPoints ? (snapIndexSv.value === 1 ? 0 : partialYSv.value) : 0
          translateY.value = withSpring(base, SPRING_BOUNCE)
          if (!hasSnapPoints) {
            overlayOpacity.value = withTiming(1, {
              duration: 250,
              easing: Easing.out(Easing.cubic),
            })
          }
          return
        }

        if (hasSnapPoints) {
          const decision = resolveSnapDecision({
            currentSnapIndex: snapIndexSv.value,
            translationY: e.translationY,
            velocityY: e.velocityY,
            partialY: partialYSv.value,
            isIOS,
          })
          if (decision === 'snapToFull') runOnJS(snapToFull)()
          else if (decision === 'snapToPartial') runOnJS(snapToPartial)()
          else if (decision === 'close') runOnJS(close)()
          else {
            const base = snapIndexSv.value === 1 ? 0 : partialYSv.value
            translateY.value = withSpring(base, SPRING_BOUNCE)
          }
        } else {
          if (e.translationY > 120 || e.velocityY > 600) {
            runOnJS(close)()
          } else {
            translateY.value = withSpring(0, SPRING_OPEN)
            overlayOpacity.value = withTiming(1, {
              duration: 250,
              easing: Easing.out(Easing.cubic),
            })
          }
        }
      })

    if (!hasSnapPoints) {
      gesture = gesture.failOffsetY(-5)
    }

    return gesture
  }, [close, snapToFull, snapToPartial, dragLock]) // eslint-disable-line react-hooks/exhaustive-deps

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  const overlayStyle = useAnimatedStyle(() => {
    if (!hasSnapPoints) {
      return { opacity: overlayOpacity.value }
    }
    const pY = partialYSv.value
    const sH = screenHeightSv.value
    if (pY === 0) {
      return { opacity: interpolate(translateY.value, [0, sH], [0.75, 0], Extrapolation.CLAMP) }
    }
    if (translateY.value <= pY) {
      return {
        opacity: interpolate(translateY.value, [0, pY], [0.75, 0.5], Extrapolation.CLAMP),
      }
    }
    return {
      opacity: interpolate(translateY.value, [pY, sH], [0.5, 0], Extrapolation.CLAMP),
    }
  })

  return {
    hasSnapPoints,
    snapIndex,
    scrollY,
    panGesture,
    sheetStyle,
    overlayStyle,
    close,
    snapToFull,
  }
}
