import { useModalSheetPanGesture } from '@/components/ui/ModalBottomSheet'
import { ThemedText } from '@/components/ui/ThemedText'
import { triggerSelection } from '@/utils/haptics'
import { useEffect, useMemo, useRef } from 'react'
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'

export const WHEEL_ITEM_HEIGHT = 44
export const WHEEL_VISIBLE_ITEMS = 7
// A short screen gets five rows rather than a sheet taller than itself.
const COMPACT_WHEEL_VISIBLE_ITEMS = 5
const COMPACT_SCREEN_HEIGHT = 700

const DEFAULT_CONTENT_WIDTH = 72
const DEFAULT_UNIT_WIDTH = 34

// A short fling barely moves a sixty-row wheel; below this the tighter deceleration reads better.
const LONG_WHEEL_OPTION_COUNT = 24

interface Option<T extends string | number> {
  value: T
  label: string
}

interface Props<T extends string | number> {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  // Drawn inside the column and never touchable: scroll surface, not a dead strip beside it.
  unit?: string
  unitWidth?: number
  // What the wheel looks like, centred inside a column that is deliberately much wider than it.
  contentWidth?: number
  // Omit to let the column stretch across its row — the widest target the layout can give it.
  width?: number
  maxWidth?: number
}

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView)

export function WheelPicker<T extends string | number>({
  options,
  value,
  onChange,
  unit,
  unitWidth = DEFAULT_UNIT_WIDTH,
  contentWidth = DEFAULT_CONTENT_WIDTH,
  width,
  maxWidth,
}: Props<T>) {
  const scrollViewRef = useRef<ScrollView>(null)
  const scrollY = useSharedValue(0)
  const lastIndexRef = useRef<number>(-1)
  const sheetPanGesture = useModalSheetPanGesture()
  const { height: screenHeight } = useWindowDimensions()

  const visibleItems =
    screenHeight < COMPACT_SCREEN_HEIGHT ? COMPACT_WHEEL_VISIBLE_ITEMS : WHEEL_VISIBLE_ITEMS
  const visibleHalf = (visibleItems - 1) / 2

  const selectedIndex = useMemo(() => {
    const idx = options.findIndex((o) => o.value === value)
    return idx === -1 ? 0 : idx
  }, [options, value])

  // Without this the sheet's drag wins a flick that started a few pixels off the numbers.
  const scrollGesture = useMemo(
    () =>
      sheetPanGesture
        ? Gesture.Native().blocksExternalGesture(sheetPanGesture).shouldCancelWhenOutside(false)
        : Gesture.Native().shouldCancelWhenOutside(false),
    [sheetPanGesture]
  )

  useEffect(() => {
    const offset = selectedIndex * WHEEL_ITEM_HEIGHT
    scrollViewRef.current?.scrollTo({ y: offset, animated: false })
    scrollY.value = offset
    lastIndexRef.current = selectedIndex
  }, [selectedIndex, scrollY])

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
  })

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y
    const index = Math.round(y / WHEEL_ITEM_HEIGHT)
    const clamped = Math.max(0, Math.min(options.length - 1, index))
    if (clamped !== lastIndexRef.current) {
      lastIndexRef.current = clamped
      triggerSelection()
      const next = options[clamped]?.value
      if (next !== undefined && next !== value) onChange(next)
    }
  }

  const totalHeight = WHEEL_ITEM_HEIGHT * visibleItems
  const paddingVertical = WHEEL_ITEM_HEIGHT * visibleHalf
  const unitInset = unit ? unitWidth : 0

  return (
    <View
      style={[{ height: totalHeight }, width != null ? { width } : { flex: 1, maxWidth }]}
      className="overflow-hidden">
      <GestureDetector gesture={scrollGesture}>
        <AnimatedScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={WHEEL_ITEM_HEIGHT}
          decelerationRate={options.length > LONG_WHEEL_OPTION_COUNT ? 'normal' : 'fast'}
          onScroll={scrollHandler}
          onMomentumScrollEnd={handleMomentumEnd}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingVertical, alignItems: 'center' }}>
          {options.map((opt, idx) => (
            <WheelItem
              key={String(opt.value)}
              label={opt.label}
              index={idx}
              scrollY={scrollY}
              width={contentWidth}
              paddingEnd={unitInset}
            />
          ))}
        </AnimatedScrollView>
      </GestureDetector>

      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: paddingVertical,
          left: 0,
          right: 0,
          height: WHEEL_ITEM_HEIGHT,
          alignItems: 'center',
          zIndex: 1,
        }}>
        <View style={{ width: contentWidth, height: WHEEL_ITEM_HEIGHT, flexDirection: 'row' }}>
          <View
            style={{ width: contentWidth - unitInset, height: WHEEL_ITEM_HEIGHT }}
            className="border-y border-brand-blue/40 bg-brand-blue/5 dark:border-brand-blue/30 dark:bg-brand-blue/10"
          />
          {unit ? (
            <View
              style={{ width: unitWidth, height: WHEEL_ITEM_HEIGHT }}
              className="items-center justify-center">
              <ThemedText variant="heading" weight="bold" color="muted" numberOfLines={1}>
                {unit}
              </ThemedText>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  )
}

function WheelItem({
  label,
  index,
  scrollY,
  width,
  paddingEnd,
}: {
  label: string
  index: number
  scrollY: ReturnType<typeof useSharedValue<number>>
  width: number
  paddingEnd: number
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const center = index * WHEEL_ITEM_HEIGHT
    const distance = Math.abs(scrollY.value - center) / WHEEL_ITEM_HEIGHT
    const opacity = interpolate(distance, [0, 1, 2, 3], [1, 0.55, 0.28, 0.12], Extrapolation.CLAMP)
    const scale = interpolate(distance, [0, 1, 2, 3], [1, 0.92, 0.84, 0.78], Extrapolation.CLAMP)

    return { opacity, transform: [{ scale }] }
  })

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          height: WHEEL_ITEM_HEIGHT,
          width,
          paddingEnd,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}>
      <ThemedText variant="heading" weight="semibold" numberOfLines={1}>
        {label}
      </ThemedText>
    </Animated.View>
  )
}
