import { triggerMedium } from '@/utils/haptics'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'

const LONG_PRESS_MS = 220

type ReorderablePairsProps<T> = {
  data: T[]
  dragLock: SharedValue<boolean>
  keyExtractor: (item: T, index: number) => string
  renderRow: (item: T, index: number) => ReactNode
  onReorder: (params: { from: number; to: number }) => void
}

export function ReorderablePairs<T>({
  data,
  dragLock,
  keyExtractor,
  renderRow,
  onReorder,
}: ReorderablePairsProps<T>) {
  const activeIndex = useSharedValue(-1)
  const dragY = useSharedValue(0)
  const itemHeight = useSharedValue(0)

  const len = data.length

  return (
    <View>
      {data.map((item, index) => (
        <ReorderRow
          key={keyExtractor(item, index)}
          index={index}
          length={len}
          activeIndex={activeIndex}
          dragY={dragY}
          itemHeight={itemHeight}
          dragLock={dragLock}
          measureHeight={index === 0}
          onReorder={onReorder}>
          {renderRow(item, index)}
        </ReorderRow>
      ))}
    </View>
  )
}

type ReorderRowProps = {
  index: number
  length: number
  activeIndex: SharedValue<number>
  dragY: SharedValue<number>
  itemHeight: SharedValue<number>
  dragLock: SharedValue<boolean>
  measureHeight: boolean
  onReorder: (params: { from: number; to: number }) => void
  children: ReactNode
}

function ReorderRow({
  index,
  length,
  activeIndex,
  dragY,
  itemHeight,
  dragLock,
  measureHeight,
  onReorder,
  children,
}: ReorderRowProps) {
  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(LONG_PRESS_MS)
        .onStart(() => {
          activeIndex.value = index
          dragLock.value = true
          scheduleOnRN(triggerMedium)
        })
        .onUpdate((e) => {
          dragY.value = e.translationY
        })
        .onEnd((e) => {
          const height = itemHeight.value || 1
          const raw = index + Math.round(e.translationY / height)
          const to = raw < 0 ? 0 : raw > length - 1 ? length - 1 : raw
          if (to !== index) scheduleOnRN(onReorder, { from: index, to })
          activeIndex.value = -1
          dragY.value = 0
          dragLock.value = false
        })
        .onFinalize(() => {
          if (activeIndex.value === index) {
            activeIndex.value = -1
            dragY.value = 0
            dragLock.value = false
          }
        }),
    [index, length, activeIndex, dragY, itemHeight, dragLock, onReorder]
  )

  const animatedStyle = useAnimatedStyle(() => {
    if (activeIndex.value === -1) {
      return { transform: [{ translateY: 0 }, { scale: 1 }], zIndex: 0 }
    }

    if (index === activeIndex.value) {
      return {
        transform: [{ translateY: dragY.value }, { scale: 1.03 }],
        zIndex: 20,
        elevation: 6,
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      }
    }

    const height = itemHeight.value || 1
    const rawHover = activeIndex.value + Math.round(dragY.value / height)
    const hover = rawHover < 0 ? 0 : rawHover > length - 1 ? length - 1 : rawHover

    let shift = 0
    if (activeIndex.value < hover && index > activeIndex.value && index <= hover) shift = -height
    else if (activeIndex.value > hover && index < activeIndex.value && index >= hover)
      shift = height

    return { transform: [{ translateY: shift }, { scale: 1 }], zIndex: 0 }
  })

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={animatedStyle}
        onLayout={
          measureHeight ? (e) => (itemHeight.value = e.nativeEvent.layout.height) : undefined
        }>
        {children}
      </Animated.View>
    </GestureDetector>
  )
}
