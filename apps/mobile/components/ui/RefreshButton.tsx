import Ionicons from '@expo/vector-icons/Ionicons'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity } from 'react-native'
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

interface RefreshButtonProps {
  onPress: () => void
  isLoading?: boolean
}

export function RefreshButton({ onPress, isLoading = false }: RefreshButtonProps) {
  const { t } = useTranslation()
  const rotation = useSharedValue(0)

  useEffect(() => {
    if (isLoading) {
      rotation.value = withRepeat(withTiming(360, { duration: 1000 }), -1, false)
    } else {
      cancelAnimation(rotation)
      rotation.value = 0
    }
  }, [isLoading, rotation])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    }
  })

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLoading}
      className="rounded-full bg-gray-100 p-3 dark:bg-gray-800"
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={t('a11y.refreshRates')}
      accessibilityState={{ busy: isLoading }}>
      <Animated.View style={animatedStyle}>
        <Ionicons name="reload-outline" size={20} color="#0284c7" />
      </Animated.View>
    </TouchableOpacity>
  )
}
