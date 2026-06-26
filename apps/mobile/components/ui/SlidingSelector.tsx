import Ionicons from '@expo/vector-icons/Ionicons'
import type { ComponentProps } from 'react'
import { useCallback, useEffect, useRef } from 'react'
import { TouchableOpacity, View } from 'react-native'

import { ThemedText } from '@/components/ui/ThemedText'
import { useThemedColor } from '@/hooks/useThemedColor'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'

type IoniconName = ComponentProps<typeof Ionicons>['name']

type SlidingOption<T extends string | number> = {
  value: T
  label: string
  icon?: IoniconName
  activeIcon?: IoniconName
}

type SlidingSelectorProps<T extends string | number> = {
  options: SlidingOption<T>[]
  value: T
  onChange: (value: T) => void
  variant: 'blue' | 'white'
}

const SNAP_SPRING = { damping: 50, stiffness: 250 }
const PULL_SPRING = { damping: 15, stiffness: 150 }
const STRETCH_RATIO = 7

const STYLES = {
  blue: {
    container: 'flex-row rounded-2xl bg-white p-1.5 dark:bg-gray-800',
    indicator: 'rounded-xl bg-blue-500 dark:bg-blue-600',
    itemPadding: 'py-3',
    activeText: 'text-white',
    inactiveText: 'text-gray-500 dark:text-gray-400',
    activeIconColor: '#ffffff',
    inactiveIconColor: { dark: '#9ca3af', light: '#6b7280' },
  },
  white: {
    container: 'flex-row rounded-xl bg-gray-100 p-1 dark:bg-gray-900',
    indicator: 'rounded-lg bg-white dark:bg-gray-700',
    itemPadding: 'py-2',
    activeText: 'text-blue-500 dark:text-blue-400',
    inactiveText: 'text-gray-400 dark:text-gray-500',
    activeIconColor: '#3b82f6',
    inactiveIconColor: { dark: '#9ca3af', light: '#9ca3af' },
  },
} as const

export function SlidingSelector<T extends string | number>({
  options,
  value,
  onChange,
  variant,
}: SlidingSelectorProps<T>) {
  const isDark = useThemedColor()
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  )

  const indicatorX = useSharedValue(0)
  const indicatorWidth = useSharedValue(0)
  const indicatorScale = useSharedValue(1)
  const layoutReady = useSharedValue(0)

  const pressHandledRef = useRef(false)
  const pressOutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Refs so timeout callbacks always read the latest values without stale closures
  const selectedIndexRef = useRef(selectedIndex)
  selectedIndexRef.current = selectedIndex
  const itemWidthRef = useRef(0)

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }, { scale: indicatorScale.value }],
    width: indicatorWidth.value,
    opacity: layoutReady.value,
  }))

  const handleLayout = useCallback(
    (width: number) => {
      const iw = width / options.length
      itemWidthRef.current = iw
      // Jump (no spring) on layout — avoids sliding from 0 on first render
      indicatorX.value = selectedIndexRef.current * iw
      indicatorWidth.value = iw
      layoutReady.value = 1
    },
    [options.length, indicatorX, indicatorWidth, layoutReady]
  )

  const handlePressIn = useCallback(
    (index: number) => {
      const iw = itemWidthRef.current
      pressHandledRef.current = false
      if (index === selectedIndexRef.current || iw === 0) {
        if (index === selectedIndexRef.current) {
          indicatorScale.value = withSpring(0.92)
        }
        return
      }

      const currentX = selectedIndexRef.current * iw
      const stretch = STRETCH_RATIO

      if (index > selectedIndexRef.current) {
        indicatorWidth.value = withSpring(iw + stretch, PULL_SPRING)
      } else {
        indicatorX.value = withSpring(currentX - stretch, PULL_SPRING)
        indicatorWidth.value = withSpring(iw + stretch, PULL_SPRING)
      }
    },
    [indicatorX, indicatorWidth, indicatorScale]
  )

  const handlePress = useCallback(
    (index: number, optionValue: T) => {
      const iw = itemWidthRef.current
      pressHandledRef.current = true
      onChange(optionValue)
      indicatorX.value = withSpring(index * iw, SNAP_SPRING)
      indicatorWidth.value = withSpring(iw, SNAP_SPRING)
    },
    [onChange, indicatorX, indicatorWidth]
  )

  const handlePressOut = useCallback(
    (index: number) => {
      if (index === selectedIndexRef.current) {
        indicatorScale.value = withSpring(1)
        return
      }
      pressOutTimerRef.current = setTimeout(() => {
        if (!pressHandledRef.current) {
          const iw = itemWidthRef.current
          indicatorX.value = withSpring(selectedIndexRef.current * iw, SNAP_SPRING)
          indicatorWidth.value = withSpring(iw, SNAP_SPRING)
        }
      }, 10)
    },
    [indicatorX, indicatorWidth, indicatorScale]
  )

  // Animate indicator when value changes externally (e.g. after a backup restore)
  useEffect(() => {
    const iw = itemWidthRef.current
    if (iw === 0) return // layout not ready yet — handleLayout will set the initial position
    indicatorX.value = withSpring(selectedIndex * iw, SNAP_SPRING)
    indicatorWidth.value = withSpring(iw, SNAP_SPRING)
  }, [selectedIndex, indicatorX, indicatorWidth])

  useEffect(() => {
    return () => {
      if (pressOutTimerRef.current !== null) {
        clearTimeout(pressOutTimerRef.current)
      }
    }
  }, [])

  const s = STYLES[variant]

  return (
    <View className={s.container}>
      <View
        className="flex-1 flex-row"
        onLayout={(e) => handleLayout(e.nativeEvent.layout.width)}
        style={{ position: 'relative' }}>
        <Animated.View
          className={`absolute bottom-0 top-0 ${s.indicator}`}
          style={indicatorStyle}
        />
        {options.map((option, index) => {
          const isSelected = option.value === value
          return (
            <TouchableOpacity
              key={String(option.value)}
              onPressIn={() => handlePressIn(index)}
              onPress={() => handlePress(index, option.value)}
              onPressOut={() => handlePressOut(index)}
              className={`flex-1 flex-row items-center justify-center gap-2 text-gray-400 ${s.itemPadding}`}
              activeOpacity={1}>
              {option.icon && option.activeIcon && (
                <Ionicons
                  name={isSelected ? option.activeIcon : option.icon}
                  size={17}
                  color={
                    isSelected
                      ? s.activeIconColor
                      : isDark
                        ? s.inactiveIconColor.dark
                        : s.inactiveIconColor.light
                  }
                />
              )}
              <ThemedText
                variant="label"
                weight="semibold"
                color="inherit"
                className={isSelected ? s.activeText : s.inactiveText}>
                {option.label}
              </ThemedText>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}
