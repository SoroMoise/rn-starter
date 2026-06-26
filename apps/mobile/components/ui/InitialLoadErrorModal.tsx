import Ionicons from '@expo/vector-icons/Ionicons'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { triggerError } from '@/utils/haptics'
import { useThemedColor } from '@hooks/useThemedColor'
import { ActivityIndicator, Modal, TouchableOpacity, View } from 'react-native'

import { ThemedText } from '@/components/ui/ThemedText'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'

interface InitialLoadErrorModalProps {
  visible: boolean
  onRetry: () => void
  isRetrying?: boolean
}

export function InitialLoadErrorModal({
  visible,
  onRetry,
  isRetrying = false,
}: InitialLoadErrorModalProps) {
  const { t } = useTranslation()
  const isDark = useThemedColor()

  const scale = useSharedValue(0)
  const opacity = useSharedValue(0)

  useEffect(() => {
    if (visible) {
      triggerError()
      scale.value = withSpring(1, {
        damping: 50,
        stiffness: 350,
      })
      opacity.value = withTiming(1, { duration: 200 })
    } else {
      scale.value = withTiming(0, { duration: 200 })
      opacity.value = withTiming(0, { duration: 200 })
    }
  }, [visible, scale, opacity])

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * 0.5,
  }))

  if (!visible) return null

  return (
    <Modal transparent visible={visible} animationType="none">
      <View className="flex-1 items-center justify-center px-6">
        <Animated.View
          style={[
            animatedBackdropStyle,
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: '#000',
            },
          ]}
        />

        <Animated.View
          style={animatedModalStyle}
          className={`w-full max-w-md rounded-3xl p-6 shadow-2xl ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
          <View className="mb-6 items-center">
            <View className="mb-4 items-center justify-center rounded-full bg-red-100 p-4 dark:bg-red-900/30">
              <Ionicons
                name="cloud-offline-outline"
                size={48}
                color={isDark ? '#f87171' : '#ef4444'}
              />
            </View>

            <ThemedText variant="title" align="center" className="mb-2">
              {t('initialization.errorTitle')}
            </ThemedText>

            <ThemedText color="muted" align="center">
              {t('initialization.errorMessage')}
            </ThemedText>
          </View>

          <View className="mb-4 rounded-2xl bg-blue-50 p-4 dark:bg-blue-900/20">
            <View className="flex-row items-start gap-3">
              <Ionicons
                name="information-circle"
                size={24}
                color={isDark ? '#60a5fa' : '#3b82f6'}
                style={{ marginTop: 2 }}
              />
              <ThemedText
                variant="label"
                color="inherit"
                weight="normal"
                className="flex-1 text-blue-800 dark:text-blue-300">
                {t('common.offline')} - {t('error.networkError')}
              </ThemedText>
            </View>
          </View>

          <TouchableOpacity
            onPress={onRetry}
            disabled={isRetrying}
            className={`items-center justify-center rounded-2xl py-4 ${
              isRetrying ? 'bg-gray-300 dark:bg-gray-700' : 'bg-blue-600 dark:bg-blue-500'
            }`}
            activeOpacity={0.7}>
            {isRetrying ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator color={isDark ? '#fff' : '#fff'} />
                <ThemedText variant="button" color="inverse">
                  {t('common.loading')}
                </ThemedText>
              </View>
            ) : (
              <View className="flex-row items-center gap-2">
                <Ionicons name="reload" size={20} color="#fff" />
                <ThemedText variant="button" color="inverse">
                  {t('initialization.retryButton')}
                </ThemedText>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  )
}
