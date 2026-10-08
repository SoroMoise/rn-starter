import { AnimatedPressable } from '@/components/ui/AnimatedPressable'
import { ThemedText } from '@/components/ui/ThemedText'
import React from 'react'
import { View } from 'react-native'
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'

const SPRING_DOWN = { damping: 20, stiffness: 300, mass: 0.5 }
const SPRING_UP = { damping: 15, stiffness: 200, mass: 0.6 }

type PaywallPlanCardProps = {
  label: string
  priceString: string
  periodLabel: string
  savingsBadge?: string
  trialBadge?: string
  isSelected: boolean
  isDisabled: boolean
  onSelect: () => void
}

export function PaywallPlanCard({
  label,
  priceString,
  periodLabel,
  savingsBadge,
  trialBadge,
  isSelected,
  isDisabled,
  onSelect,
}: PaywallPlanCardProps) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const cardClass = isSelected
    ? 'border-pro-500 bg-pro-50 dark:bg-pro-500/[0.08]'
    : 'border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800'
  const radioClass = isSelected ? 'border-pro-500' : 'border-gray-300 dark:border-gray-600'

  return (
    <AnimatedPressable
      onPress={onSelect}
      onPressIn={() => {
        scale.value = withSpring(0.96, SPRING_DOWN)
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING_UP)
      }}
      disabled={isDisabled}
      className={`mb-2.5 flex-row items-center gap-3 rounded-[14px] border-[1.5px] p-[14px] ${cardClass}`}
      style={animatedStyle}
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected, disabled: isDisabled }}>
      {(savingsBadge || trialBadge) && (
        <View className="absolute -top-3 left-3 flex-row gap-2.5">
          {savingsBadge && (
            <View className="rounded-full bg-pro-500 px-2.5 py-px">
              <ThemedText color="inverse" weight="bold" className="text-[11px] leading-4">
                {savingsBadge}
              </ThemedText>
            </View>
          )}
          {trialBadge && (
            <View className="rounded-full bg-success-100 px-2.5 py-px dark:bg-success-500">
              <ThemedText
                className="text-[11px] font-semibold leading-4 text-success-600 dark:text-white"
                color="inherit">
                {trialBadge}
              </ThemedText>
            </View>
          )}
        </View>
      )}

      <View className="flex-1 gap-0.5">
        <ThemedText variant="body" weight="semibold">
          {label}
        </ThemedText>
        <ThemedText variant="label" color="muted" weight="normal">
          {periodLabel}
        </ThemedText>
      </View>

      <View className="items-end gap-1.5">
        <ThemedText variant="body" weight="bold">
          {priceString}
        </ThemedText>
        <View className={`h-5 w-5 items-center justify-center rounded-full border-2 ${radioClass}`}>
          {isSelected && <View className="h-2.5 w-2.5 rounded-full bg-pro-500" />}
        </View>
      </View>
    </AnimatedPressable>
  )
}
