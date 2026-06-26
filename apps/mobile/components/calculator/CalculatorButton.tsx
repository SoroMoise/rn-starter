import { ThemedText } from '@/components/ui/ThemedText'
import { triggerError, triggerLight, triggerMedium, triggerSuccess } from '@utils/haptics'
import React from 'react'
import { Pressable } from 'react-native'
import Animated, {
  WithSpringConfig,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { useThemeColor } from '../Themed'

interface CalculatorButtonProps {
  label: string
  onPress: () => void
  onLongPress?: () => void
  variant: 'digit' | 'operator' | 'clear' | 'equals' | 'function'
  accessibilityLabel?: string
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

const textClassByVariant: Record<CalculatorButtonProps['variant'], string> = {
  digit: 'text-3xl font-medium text-gray-900 dark:text-gray-100',
  operator: 'text-3xl font-bold text-emerald-400',
  clear: 'text-2xl font-bold text-red-500',
  function: 'text-2xl font-bold text-emerald-400',
  equals: 'text-3xl font-bold text-white',
}

const anim: WithSpringConfig = { duration: 100 }

export function CalculatorButton({
  label,
  onPress,
  onLongPress,
  variant,
  accessibilityLabel,
}: Readonly<CalculatorButtonProps>) {
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)
  const colors = useThemeColor()
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.9, anim)
    opacity.value = withSpring(0.7, anim)
  }

  const handlePressOut = () => {
    scale.value = withSpring(1.03, anim, () => {
      scale.value = withSpring(1, anim)
    })
    opacity.value = withSpring(1, anim)
  }

  const handlePress = () => {
    switch (variant) {
      case 'digit':
        triggerLight()
        break
      case 'operator':
        triggerMedium()
        break
      case 'clear':
        triggerMedium()
        break
      case 'equals':
        // no key haptic: the success cue fires when the result is applied
        break
      case 'function':
        triggerLight()
        break
    }
    onPress()
  }

  const isEquals = variant === 'equals'

  return (
    <AnimatedPressable
      onPress={handlePress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={[
        animatedStyle,
        {
          alignSelf: 'stretch' as const,
          height: 48,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          borderRadius: 16,
          backgroundColor: colors.card,
          ...(isEquals && {
            shadowColor: '#34d399',
            backgroundColor: '#34d399',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
          }),
        },
      ]}>
      <ThemedText color="inherit" variant="inherit" className={textClassByVariant[variant]}>
        {label}
      </ThemedText>
    </AnimatedPressable>
  )
}

export function triggerErrorHaptic() {
  triggerError()
}

export function triggerCopyHaptic() {
  triggerSuccess()
}
