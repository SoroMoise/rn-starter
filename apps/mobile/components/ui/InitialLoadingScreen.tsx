import Ionicons from '@expo/vector-icons/Ionicons'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useThemedColor } from '@hooks/useThemedColor'
import { View } from 'react-native'

import { ThemedText } from '@/components/ui/ThemedText'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'

export function InitialLoadingScreen() {
  const { t } = useTranslation()
  const isDark = useThemedColor()

  const rotation = useSharedValue(0)
  const scale = useSharedValue(1)

  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 2000 }), -1, false)

    scale.value = withRepeat(
      withSequence(withTiming(1.1, { duration: 1000 }), withTiming(1, { duration: 1000 })),
      -1,
      true
    )
  }, [rotation, scale])

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }))

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top', 'bottom']}>
      <View className="flex-1 items-center justify-center px-6">
        <Animated.View style={animatedLogoStyle} className="mb-8">
          <View className="items-center justify-center rounded-full bg-blue-100 p-6 dark:bg-blue-900/30">
            <ThemedText color="inherit" className="text-6xl">
              💱
            </ThemedText>
          </View>
        </Animated.View>

        <Animated.View style={animatedIconStyle} className="mb-6">
          <Ionicons name="sync" size={48} color={isDark ? '#60a5fa' : '#3b82f6'} />
        </Animated.View>

        <ThemedText variant="title" align="center" className="mb-3">
          {t('initialization.loading')}
        </ThemedText>

        <ThemedText color="muted" align="center">
          {t('initialization.loadingSubtitle')}
        </ThemedText>

        <View className="mt-12 flex-row items-center gap-2">
          {[0, 1, 2].map((index) => (
            <LoadingDot key={index} delay={index * 200} isDark={isDark} />
          ))}
        </View>
      </View>
    </SafeAreaView>
  )
}

function LoadingDot({ delay, isDark }: { delay: number; isDark: boolean }) {
  const opacity = useSharedValue(0.3)

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 600 }), withTiming(0.3, { duration: 600 })),
      -1,
      true
    )
  }, [opacity])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: isDark ? '#60a5fa' : '#3b82f6',
        },
      ]}
    />
  )
}
