import { ThemedText } from '@/components/ui/ThemedText'
import { UI_CONFIG } from '@/constants/config'
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight'
import { ModalToastViewport } from '@/providers/ToastProvider'
import { triggerLight } from '@utils/haptics'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, Pressable, TouchableOpacity, View, useWindowDimensions } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

// A dialog is sized by its content, so the cap is what keeps a long body on screen rather than off it.
const MAX_HEIGHT_RATIO = 0.86

interface ModalDialogProps {
  visible: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  // Sits outside the body, so the actions that end the dialog never scroll away.
  footer?: React.ReactNode
  // Leave it off where the footer already carries the way out: two identical exits are noise.
  showCloseButton?: boolean
}

export function ModalDialog({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  showCloseButton = true,
}: ModalDialogProps) {
  const { t } = useTranslation()
  const { height } = useWindowDimensions()
  const keyboardHeight = useKeyboardHeight({ enabled: visible })

  // The card centres in what the keyboard leaves of the screen, and shrinks into it, rather than
  // staying centred on a screen half of which is covered.
  const availableHeight = height - keyboardHeight

  const handleClose = useCallback(() => {
    triggerLight()
    onClose()
  }, [onClose])

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Pressable
          className="absolute inset-0 bg-black/50"
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
        />

        <View
          pointerEvents="box-none"
          style={{ paddingBottom: keyboardHeight }}
          className="flex-1 justify-center px-5">
          <View
            style={{
              width: '100%',
              maxWidth: UI_CONFIG.MAX_CONTENT_WIDTH,
              maxHeight: availableHeight * MAX_HEIGHT_RATIO,
              flexShrink: 1,
              alignSelf: 'center',
            }}
            className="overflow-hidden rounded-3xl bg-gray-50 dark:bg-gray-900">
            <View className="flex-row items-start justify-between px-5 pb-3 pt-5">
              <View className="flex-1 pe-3">
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
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.close')}
                  className="h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                  <ThemedText color="inherit" className="text-lg text-gray-600 dark:text-gray-300">
                    ✕
                  </ThemedText>
                </TouchableOpacity>
              ) : null}
            </View>

            {children}

            {footer}
          </View>
        </View>

        <ModalToastViewport active={visible} />
      </GestureHandlerRootView>
    </Modal>
  )
}
