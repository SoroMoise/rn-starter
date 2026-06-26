import { ThemedText } from '@/components/ui/ThemedText'
import Colors from '@/constants/Colors'
import { PlanType } from '@/constants/purchases'
import { useThemedColor } from '@/hooks/useThemedColor'
import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

const SPRING_DOWN = { damping: 20, stiffness: 300, mass: 0.5 }
const SPRING_UP = { damping: 15, stiffness: 200, mass: 0.6 }

type PaywallPlanCardProps = {
  type: PlanType
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
  type,
  label,
  priceString,
  periodLabel,
  savingsBadge,
  trialBadge,
  isSelected,
  isDisabled,
  onSelect,
}: PaywallPlanCardProps) {
  const isDark = useThemedColor()
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

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
      style={[
        animatedStyle,
        styles.card,
        isDark ? styles.cardDark : styles.cardLight,
        isSelected && styles.cardSelected,
        isSelected && isDark && styles.cardSelectedDark,
      ]}
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected, disabled: isDisabled }}>
      {/* Badges */}
      {(savingsBadge || (trialBadge && type === 'annual')) && (
        <View style={styles.badges}>
          {savingsBadge && (
            <View style={styles.savingsBadge}>
              <ThemedText style={styles.savingsText} color="inherit">
                {savingsBadge}
              </ThemedText>
            </View>
          )}
          {trialBadge && type === 'annual' && (
            <View style={[styles.trialBadge, isDark && styles.trialBadgeDark]}>
              <ThemedText style={[styles.trialText, isDark && { color: '#fff' }]} color="inherit">
                {trialBadge}
              </ThemedText>
            </View>
          )}
        </View>
      )}

      {/* Info */}
      <View style={styles.info}>
        <ThemedText variant="body" weight="semibold">
          {label}
        </ThemedText>
        <ThemedText variant="label" color="muted" weight="normal">
          {periodLabel}
        </ThemedText>
      </View>

      {/* Price + radio */}
      <View style={styles.right}>
        <ThemedText variant="body" weight="bold">
          {priceString}
        </ThemedText>
        <View
          style={[styles.radio, isDark && styles.radioDark, isSelected && styles.radioSelected]}>
          {isSelected && <View style={styles.radioDot} />}
        </View>
      </View>
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    position: 'relative',
  },
  cardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#f3f4f6',
  },
  cardDark: {
    backgroundColor: Colors.dark.card,
    borderColor: '#374151',
  },
  cardSelected: {
    borderColor: '#8b5cf6',
    backgroundColor: '#f5f3ff',
  },
  cardSelectedDark: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderColor: '#8b5cf6',
  },
  badges: {
    position: 'absolute',
    top: -12,
    left: 12,
    flexDirection: 'row',
    gap: 10,
  },
  savingsBadge: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 10,
    paddingVertical: 1,
    borderRadius: 99,
  },
  savingsText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  trialBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 1,
    borderRadius: 99,
  },
  trialBadgeDark: {
    backgroundColor: '#10B981',
  },
  trialText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '600',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 6,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDark: {
    borderColor: '#4b5563',
  },
  radioSelected: {
    borderColor: '#8b5cf6',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#8b5cf6',
  },
})
