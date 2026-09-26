import { DirectionalIcon } from '@/components/ui/DirectionalIcon'
import { GradientButton } from '@/components/ui/GradientButton'
import { ThemedText } from '@/components/ui/ThemedText'
import { GRADIENTS, UI_COLORS } from '@/constants/uiColors'
import { triggerLight } from '@/utils/haptics'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useThemedColor } from '@hooks/useThemedColor'
import { LinearGradient } from 'expo-linear-gradient'
import type { ComponentProps, ReactNode } from 'react'
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type OnboardingStepLayoutProps = {
  icon: ComponentProps<typeof Ionicons>['name']
  iconColor?: string
  title: string
  subtitle: string
  children?: ReactNode
  ctaLabel: string
  onCta: () => void
  isCtaDisabled?: boolean
  secondary?: { label: string; onPress: () => void }
}

export function OnboardingStepLayout({
  icon,
  iconColor = UI_COLORS.brandBlue,
  title,
  subtitle,
  children,
  ctaLabel,
  onCta,
  isCtaDisabled = false,
  secondary,
}: OnboardingStepLayoutProps) {
  const isDark = useThemedColor()
  const insets = useSafeAreaInsets()
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()

  return (
    <View style={{ width: screenWidth, height: screenHeight }} className="flex-1">
      <LinearGradient
        colors={isDark ? GRADIENTS.onboardingStepDark : GRADIENTS.onboardingStepLight}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 96,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 24,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View className="mb-5 h-16 w-16 items-center justify-center overflow-hidden rounded-3xl">
          <View
            className="absolute inset-0"
            style={{ backgroundColor: iconColor, opacity: 0.15 }}
          />
          <Ionicons name={icon} size={30} color={iconColor} />
        </View>

        <ThemedText variant="display" className="text-3xl">
          {title}
        </ThemedText>

        <ThemedText variant="body" color="muted" className="mt-2.5">
          {subtitle}
        </ThemedText>

        {children ? <View className="mt-6">{children}</View> : null}

        <GradientButton
          onPress={() => {
            triggerLight()
            onCta()
          }}
          disabled={isCtaDisabled}
          colors={GRADIENTS.cta}
          style={{ height: 58, borderRadius: 16, marginTop: 28 }}
          gradientStyle={{ height: '100%', gap: 8 }}
          accessibilityLabel={ctaLabel}>
          <ThemedText variant="buttonLarge" color="inverse">
            {ctaLabel}
          </ThemedText>
          <DirectionalIcon name="arrow-forward" size={20} color="#ffffff" />
        </GradientButton>

        {secondary ? (
          <Pressable
            onPress={() => {
              triggerLight()
              secondary.onPress()
            }}
            className="mt-2 items-center py-2.5"
            accessibilityRole="button">
            <ThemedText variant="body" color="dimmed" weight="semibold">
              {secondary.label}
            </ThemedText>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  )
}
