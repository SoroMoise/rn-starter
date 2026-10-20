import { OnboardingForwardContext } from '@/components/onboarding/onboardingForward'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { LayoutChangeEvent } from 'react-native'
import { I18nManager, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'

const ACTIVE_OFFSET_X = 16
const FAIL_OFFSET_Y = 12
const COMMIT_DISTANCE = 0.3
const COMMIT_VELOCITY = 600
const RESISTANCE = 0.2
const PAGE_TIMING = { duration: 320, easing: Easing.out(Easing.cubic) }
const RETURN_SPRING = { damping: 22, stiffness: 240 }
const RTL_SIGN = I18nManager.isRTL ? -1 : 1

type ForwardAction = () => void
type Registration<K extends string> = { kind: K; action: ForwardAction | null }

type OnboardingPagerProps<K extends string> = {
  pages: readonly K[]
  current: K
  renderPage: (kind: K) => ReactNode
  onBack: () => void
}

export function OnboardingPager<K extends string>({
  pages,
  current,
  renderPage,
  onBack,
}: OnboardingPagerProps<K>) {
  const index = Math.max(0, pages.indexOf(current))
  const [pageWidth, setPageWidth] = useState(0)

  const width = useSharedValue(0)
  const position = useSharedValue(index)
  const settledIndex = useSharedValue(index)
  const dragStart = useSharedValue(index)
  const canForward = useSharedValue(false)
  const canBack = useSharedValue(index > 0)

  const forwardActions = useRef(new Map<K, ForwardAction>())
  const currentRef = useRef(current)
  const swipeTargetRef = useRef<number | null>(null)

  const register = useCallback(
    ({ kind, action }: Registration<K>) => {
      if (action) forwardActions.current.set(kind, action)
      else forwardActions.current.delete(kind)
      if (kind === currentRef.current) canForward.value = action !== null
    },
    [canForward]
  )

  useEffect(() => {
    currentRef.current = current
    canForward.value = forwardActions.current.has(current)
    canBack.value = index > 0
    settledIndex.value = index
    const isSwipeLanding = swipeTargetRef.current === index
    swipeTargetRef.current = null
    if (!isSwipeLanding) position.value = withTiming(index, PAGE_TIMING)
  }, [current, index, canForward, canBack, settledIndex, position])

  const commit = useCallback(
    (direction: number) => {
      swipeTargetRef.current = pages.indexOf(currentRef.current) + direction
      if (direction > 0) forwardActions.current.get(currentRef.current)?.()
      else onBack()
    },
    [pages, onBack]
  )

  const clearSwipeTarget = useCallback(() => {
    swipeTargetRef.current = null
  }, [])

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(pageWidth > 0)
        .activeOffsetX([-ACTIVE_OFFSET_X, ACTIVE_OFFSET_X])
        .failOffsetY([-FAIL_OFFSET_Y, FAIL_OFFSET_Y])
        .onStart(() => {
          cancelAnimation(position)
          dragStart.value = position.value
        })
        .onUpdate((event) => {
          const travel = (-event.translationX * RTL_SIGN) / width.value
          const relative = dragStart.value + travel - settledIndex.value
          const isAllowed = relative > 0 ? canForward.value : canBack.value
          position.value =
            settledIndex.value +
            (isAllowed ? Math.max(-1, Math.min(1, relative)) : relative * RESISTANCE)
        })
        .onEnd((event) => {
          const relative = position.value - settledIndex.value
          const velocity = -event.velocityX * RTL_SIGN
          let direction = 0
          if (Math.abs(velocity) > COMMIT_VELOCITY) direction = Math.sign(velocity)
          else if (Math.abs(relative) > COMMIT_DISTANCE) direction = Math.sign(relative)
          if (direction !== Math.sign(relative)) direction = 0
          if (direction > 0 && !canForward.value) direction = 0
          if (direction < 0 && !canBack.value) direction = 0

          if (direction === 0) {
            position.value = withSpring(settledIndex.value, RETURN_SPRING)
            return
          }

          const target = settledIndex.value + direction
          position.value = withTiming(target, PAGE_TIMING, (finished) => {
            if (!finished || settledIndex.value === target) return
            position.value = withSpring(settledIndex.value, RETURN_SPRING)
            scheduleOnRN(clearSwipeTarget)
          })
          scheduleOnRN(commit, direction)
        }),
    [
      pageWidth,
      position,
      dragStart,
      width,
      settledIndex,
      canForward,
      canBack,
      commit,
      clearSwipeTarget,
    ]
  )

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const next = event.nativeEvent.layout.width
      width.value = next
      setPageWidth(next)
    },
    [width]
  )

  return (
    <GestureDetector gesture={pan}>
      <View collapsable={false} className="flex-1 overflow-hidden" onLayout={handleLayout}>
        {pages.map((kind, pageIndex) => {
          const isCurrent = pageIndex === index
          const isMounted = isCurrent || (pageWidth > 0 && Math.abs(pageIndex - index) === 1)
          if (!isMounted) return null
          return (
            <OnboardingPage
              key={kind}
              kind={kind}
              pageIndex={pageIndex}
              isCurrent={isCurrent}
              position={position}
              width={width}
              register={register}>
              {renderPage(kind)}
            </OnboardingPage>
          )
        })}
      </View>
    </GestureDetector>
  )
}

type OnboardingPageProps<K extends string> = {
  kind: K
  pageIndex: number
  isCurrent: boolean
  position: SharedValue<number>
  width: SharedValue<number>
  register: (registration: Registration<K>) => void
  children: ReactNode
}

function OnboardingPage<K extends string>({
  kind,
  pageIndex,
  isCurrent,
  position,
  width,
  register,
  children,
}: OnboardingPageProps<K>) {
  const registerForward = useCallback(
    (action: ForwardAction | null) => register({ kind, action }),
    [register, kind]
  )

  const slideStyle = useAnimatedStyle(() => ({
    opacity: isCurrent || width.value > 0 ? 1 : 0,
    transform: [{ translateX: (pageIndex - position.value) * width.value * RTL_SIGN }],
  }))

  return (
    <Animated.View
      className="absolute inset-0"
      style={slideStyle}
      pointerEvents={isCurrent ? 'auto' : 'none'}
      importantForAccessibility={isCurrent ? 'auto' : 'no-hide-descendants'}
      accessibilityElementsHidden={!isCurrent}>
      <OnboardingForwardContext.Provider value={registerForward}>
        {children}
      </OnboardingForwardContext.Provider>
    </Animated.View>
  )
}
