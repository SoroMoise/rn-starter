import { useSheetScrollable } from '@/components/ui/modalSheet/contexts'
import React, { forwardRef } from 'react'
import { FlatListProps } from 'react-native'
import { GestureDetector } from 'react-native-gesture-handler'
import Animated from 'react-native-reanimated'

export function ModalBottomSheetFlatList<T>(
  props: Omit<FlatListProps<T>, 'onScroll' | 'CellRendererComponent'>
) {
  const { scrollHandler, nativeGesture } = useSheetScrollable()

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
  const { scrollHandler, nativeGesture } = useSheetScrollable()

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
