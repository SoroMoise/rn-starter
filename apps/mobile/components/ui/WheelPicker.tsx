import { ThemedText } from '@/components/ui/ThemedText'
import { triggerSelection } from '@/utils/haptics'
import { useThemedColor } from '@hooks/useThemedColor'
import { useEffect, useMemo, useRef } from 'react'
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, View } from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'

export const WHEEL_ITEM_HEIGHT = 44
export const WHEEL_VISIBLE_ITEMS = 5
const VISIBLE_HALF = (WHEEL_VISIBLE_ITEMS - 1) / 2

interface Option<T extends string | number> {
  value: T
  label: string
}

interface Props<T extends string | number> {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  width?: number
}

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView)

export function WheelPicker<T extends string | number>({
  options,
  value,
  onChange,
  width = 80,
}: Props<T>) {
  const scrollViewRef = useRef<ScrollView>(null)
  const scrollY = useSharedValue(0)
  const isDark = useThemedColor()
  const lastIndexRef = useRef<number>(-1)

  const selectedIndex = useMemo(() => {
    const idx = options.findIndex((o) => o.value === value)
    return idx === -1 ? 0 : idx
  }, [options, value])

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

  const totalHeight = WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_ITEMS
  const paddingVertical = WHEEL_ITEM_HEIGHT * VISIBLE_HALF

  return (
    <View style={{ width, height: totalHeight }} className="overflow-hidden">
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: WHEEL_ITEM_HEIGHT * VISIBLE_HALF,
          left: 0,
          right: 0,
          height: WHEEL_ITEM_HEIGHT,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: isDark ? 'rgba(245,158,11,0.35)' : 'rgba(245,158,11,0.45)',
          backgroundColor: isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.06)',
          zIndex: 1,
        }}
      />
      <AnimatedScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_HEIGHT}
        decelerationRate="fast"
        onScroll={scrollHandler}
        onMomentumScrollEnd={handleMomentumEnd}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingVertical }}>
        {options.map((opt, idx) => (
          <WheelItem key={String(opt.value)} label={opt.label} index={idx} scrollY={scrollY} />
        ))}
      </AnimatedScrollView>
    </View>
  )
}

function WheelItem({
  label,
  index,
  scrollY,
}: {
  label: string
  index: number
  scrollY: ReturnType<typeof useSharedValue<number>>
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const center = index * WHEEL_ITEM_HEIGHT
    const distance = Math.abs(scrollY.value - center) / WHEEL_ITEM_HEIGHT
    const opacity = interpolate(distance, [0, 1, 2], [1, 0.5, 0.2], Extrapolation.CLAMP)
    const scale = interpolate(distance, [0, 1, 2], [1, 0.9, 0.8], Extrapolation.CLAMP)

    return { opacity, transform: [{ scale }] }
  })

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          height: WHEEL_ITEM_HEIGHT,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}>
      <ThemedText variant="heading" weight="semibold">
        {label}
      </ThemedText>
    </Animated.View>
  )
}
