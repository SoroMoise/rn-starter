import {
  ModalDraggableContext,
  ModalScrollContext,
  ModalSnapContext,
} from '@/components/ui/modalSheet/contexts'
import { ThemedText } from '@/components/ui/ThemedText'
import { useSheetSnap } from '@/hooks/useSheetSnap'
import { ModalToastViewport } from '@/providers/ToastProvider'
import { SHEET_TOP_OFFSET } from '@utils/snapBottomSheet'
import React, { forwardRef, useCallback, useImperativeHandle } from 'react'
import { Modal, TouchableOpacity, View } from 'react-native'
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'
import type { SharedValue } from 'react-native-reanimated'
import Animated from 'react-native-reanimated'

export { useIsSheetAtFullSnap } from '@/components/ui/modalSheet/contexts'
export {
  ModalBottomSheetFlatList,
  ModalBottomSheetScrollView,
} from '@/components/ui/modalSheet/scrollables'

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
    const sheet = useSheetSnap({ visible, initialSnap, dragLock, onClose })
    const { close, hasSnapPoints, snapToFull } = sheet

    const handleRequestClose = useCallback(() => {
      if (onHardwareBack?.()) return
      close()
    }, [onHardwareBack, close])

    useImperativeHandle(
      ref,
      () => ({
        close,
        ...(hasSnapPoints ? { snapToFull } : {}),
      }),
      [close, hasSnapPoints, snapToFull]
    )

    return (
      <Modal visible={visible} animationType="none" onRequestClose={handleRequestClose} transparent>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Animated.View
            className="absolute inset-0 bg-black/50"
            style={sheet.overlayStyle}
            pointerEvents="none"
          />
          <GestureDetector gesture={sheet.panGesture}>
            <View className={`flex-1 ${compact ? 'justify-end' : ''}`}>
              {compact && <TouchableOpacity className="flex-1" activeOpacity={1} onPress={close} />}
              <Animated.View
                style={[sheet.sheetStyle, compact ? null : { marginTop: SHEET_TOP_OFFSET }]}
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
                          onPress={close}
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

                  <ModalScrollContext.Provider value={sheet.scrollY}>
                    <ModalDraggableContext.Provider value={sheet.panGesture}>
                      <ModalSnapContext.Provider value={sheet.snapIndex}>
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
