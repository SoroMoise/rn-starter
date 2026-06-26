import { ThemedText } from '@/components/ui/ThemedText'
import { ModalToastViewport } from '@/providers/ToastProvider'
import { triggerLight } from '@utils/haptics'
import { SHEET_TOP_OFFSET, computePartialY, resolveSnapDecision } from '@utils/snapBottomSheet'
import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  FlatListProps,
  Modal,
  Platform,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native'
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'
import type { SharedValue } from 'react-native-reanimated'
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'

const SPRING_OPEN = { damping: 22, stiffness: 200, mass: 0.9 }
const SPRING_SNAP = { damping: 28, stiffness: 280, mass: 0.8 }
const SPRING_BOUNCE = { damping: 35, stiffness: 420, mass: 0.7 }
const OVERSHOOT_BUFFER = 120

interface ModalBottomSheetProps {
  visible: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  compact?: boolean
  initialSnap?: number
  dragLock?: SharedValue<boolean>
  showCloseButton?: boolean
  // Intercepts the Android hardware back press. Return true when the press was
  // handled internally (e.g. navigating back a sub-view) so the sheet stays open.
  onHardwareBack?: () => boolean
}

export interface ModalBottomSheetRef {
  close: () => void
  snapToFull?: () => void
}

// Shared value tracking the inner scroll position.
// Children that contain a FlatList should use ModalBottomSheetFlatList
// which attaches the scroll handler automatically.
const ModalScrollContext = createContext<ReturnType<typeof useSharedValue<number>> | null>(null)

type PanGestureType = ReturnType<typeof Gesture.Pan>
const ModalDraggableContext = createContext<PanGestureType | null>(null)

const ModalSnapContext = createContext<0 | 1>(1)

export function useIsSheetAtFullSnap(): boolean {
  return useContext(ModalSnapContext) === 1
}

export function ModalBottomSheetFlatList<T>(
  props: Omit<FlatListProps<T>, 'onScroll' | 'CellRendererComponent'>
) {
  const panGesture = useContext(ModalDraggableContext)
  const scrollY = useContext(ModalScrollContext)

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      if (scrollY) scrollY.value = event.contentOffset.y
    },
  })

  const nativeGesture = useMemo(
    () =>
      panGesture
        ? Gesture.Native()
            .simultaneousWithExternalGesture(panGesture)
            .shouldCancelWhenOutside(false)
        : Gesture.Native(),
    [panGesture]
  )

  return (
    <GestureDetector gesture={nativeGesture}>
      <Animated.FlatList
        {...props}
        onScroll={scrollHandler}
        scrollEventThrottle={props.scrollEventThrottle ?? 16}
      />
    </GestureDetector>
  )
}

export const ModalBottomSheetScrollView = forwardRef<
  React.ComponentRef<typeof Animated.ScrollView>,
  React.ComponentProps<typeof Animated.ScrollView>
>(function ModalBottomSheetScrollView(props, ref) {
  const panGesture = useContext(ModalDraggableContext)
  const scrollY = useContext(ModalScrollContext)

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      if (scrollY) scrollY.value = event.contentOffset.y
    },
  })

  const nativeGesture = useMemo(
    () =>
      panGesture
        ? Gesture.Native()
            .simultaneousWithExternalGesture(panGesture)
            .shouldCancelWhenOutside(false)
        : Gesture.Native(),
    [panGesture]
  )

  return (
    <GestureDetector gesture={nativeGesture}>
      <Animated.ScrollView
        ref={ref}
        {...props}
        onScroll={scrollHandler}
        scrollEventThrottle={props.scrollEventThrottle ?? 16}
      />
    </GestureDetector>
  )
})

export const ModalBottomSheet = forwardRef<ModalBottomSheetRef, ModalBottomSheetProps>(
  function ModalBottomSheet(
    {
      visible,
      onClose,
      title,
      subtitle,
      children,
      compact = false,
      initialSnap,
      dragLock,
      showCloseButton = true,
      onHardwareBack,
    },
    ref
  ) {
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
    // Tracks whether the pan gesture actually moved the sheet this interaction.
    // Prevents triggering close when the pan gesture fires over scrolled content.
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

    const handleClose = useCallback(() => {
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

    const handleRequestClose = useCallback(() => {
      if (onHardwareBack?.()) return
      handleClose()
    }, [onHardwareBack, handleClose])

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

    useImperativeHandle(
      ref,
      () => ({
        close: handleClose,
        ...(hasSnapPoints ? { snapToFull } : {}),
      }),
      [handleClose, hasSnapPoints, snapToFull]
    )

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
            else if (decision === 'close') runOnJS(handleClose)()
            else {
              const base = snapIndexSv.value === 1 ? 0 : partialYSv.value
              translateY.value = withSpring(base, SPRING_BOUNCE)
            }
          } else {
            if (e.translationY > 120 || e.velocityY > 600) {
              runOnJS(handleClose)()
            } else {
              translateY.value = withSpring(0, { damping: 22, stiffness: 200, mass: 0.9 })
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
    }, [handleClose, snapToFull, snapToPartial, dragLock]) // eslint-disable-line react-hooks/exhaustive-deps

    const animatedModalStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
    }))

    const animatedOverlayStyle = useAnimatedStyle(() => {
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

    return (
      <Modal visible={visible} animationType="none" onRequestClose={handleRequestClose} transparent>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Animated.View
            className="absolute inset-0 bg-black/50"
            style={animatedOverlayStyle}
            pointerEvents="none"
          />
          <GestureDetector gesture={panGesture}>
            <View className={`flex-1 ${compact ? 'justify-end' : ''}`}>
              {compact && (
                <TouchableOpacity className="flex-1" activeOpacity={1} onPress={handleClose} />
              )}
              <Animated.View
                style={[animatedModalStyle, compact ? null : { marginTop: SHEET_TOP_OFFSET }]}
                className={compact ? '' : 'flex-1'}>
                <View
                  className={`overflow-hidden rounded-t-3xl bg-gray-50 dark:bg-gray-900 ${compact ? '' : 'flex-1'}`}>
                  <View className="items-center py-2">
                    <View className="h-1.5 w-12 rounded-full bg-gray-300 dark:bg-gray-600" />
                  </View>

                  {title.length > 0 || subtitle || showCloseButton ? (
                    <View className="flex-row items-center justify-between px-6 py-4">
                      <View className="flex-1 pr-3">
                        <ThemedText variant="title">{title}</ThemedText>
                        {subtitle ? (
                          <ThemedText variant="label" color="muted" className="mt-0.5">
                            {subtitle}
                          </ThemedText>
                        ) : null}
                      </View>

                      {showCloseButton ? (
                        <TouchableOpacity
                          onPress={handleClose}
                          className="h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700"
                          activeOpacity={0.7}>
                          <ThemedText
                            color="inherit"
                            className="text-lg text-gray-600 dark:text-gray-300">
                            ✕
                          </ThemedText>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ) : null}

                  <ModalScrollContext.Provider value={scrollY}>
                    <ModalDraggableContext.Provider value={panGesture}>
                      <ModalSnapContext.Provider value={snapIndex}>
                        {children}
                      </ModalSnapContext.Provider>
                    </ModalDraggableContext.Provider>
                  </ModalScrollContext.Provider>
                </View>

                <View
                  pointerEvents="none"
                  className="absolute left-0 right-0 bg-white dark:bg-gray-800"
                  style={{ top: '100%', height: OVERSHOOT_BUFFER }}
                />
              </Animated.View>
            </View>
          </GestureDetector>
          <ModalToastViewport active={visible} />
        </GestureHandlerRootView>
      </Modal>
    )
  }
)
