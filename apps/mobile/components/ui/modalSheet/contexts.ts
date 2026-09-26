import { createContext, useContext, useMemo } from 'react'
import { Gesture } from 'react-native-gesture-handler'
import { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'

// Children with a FlatList should use ModalBottomSheetFlatList, which attaches the scroll handler.
export const ModalScrollContext = createContext<ReturnType<typeof useSharedValue<number>> | null>(
  null
)

type PanGestureType = ReturnType<typeof Gesture.Pan>
export const ModalDraggableContext = createContext<PanGestureType | null>(null)

export const ModalSnapContext = createContext<0 | 1>(1)

export function useIsSheetAtFullSnap(): boolean {
  return useContext(ModalSnapContext) === 1
}

// What a scrollable child that is not a list — a wheel, a carousel — blocks to keep a flick for
// itself; the sheet's pan wins it otherwise. Null outside a sheet.
export function useModalSheetPanGesture(): PanGestureType | null {
  return useContext(ModalDraggableContext)
}

export function useSheetScrollable() {
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

  return { scrollHandler, nativeGesture }
}
