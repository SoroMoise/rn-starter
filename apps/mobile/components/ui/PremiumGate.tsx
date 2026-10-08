import { ThemedText } from '@components/ui/ThemedText'
import { UI_COLORS } from '@constants/uiColors'
import Ionicons from '@expo/vector-icons/Ionicons'
import { usePremium } from '@hooks/usePremium'
import { useThemedColor } from '@hooks/useThemedColor'
import { BlurView } from 'expo-blur'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, View } from 'react-native'

const BLUR_INTENSITY = 18

type PremiumGateProps = {
  source: string
  children: React.ReactNode
}

export function PremiumGate({ source, children }: PremiumGateProps) {
  const { isPremium, isInitialized, openPaywall } = usePremium()
  const isDark = useThemedColor()
  const { t } = useTranslation()

  if (!isInitialized) return null

  if (isPremium) return <>{children}</>

  return (
    <View>
      {children}
      {/* Android renders no blur at all without `experimentalBlurMethod`, and samples the screen
          the view sits in: inside a native Modal it would blur the screen under the modal. */}
      <BlurView
        intensity={BLUR_INTENSITY}
        tint={isDark ? 'dark' : 'light'}
        experimentalBlurMethod="dimezisBlurView"
        style={styles.blur}
        pointerEvents="none"
      />
      <Pressable
        className="absolute inset-0 items-center justify-center rounded-xl bg-white/[0.55] dark:bg-[#0f0f14]/[0.55]"
        onPress={() => void openPaywall({ source })}
        accessibilityRole="button"
        accessibilityLabel={t('premiumGate.unlock')}>
        <View className="items-center gap-2">
          <View className="h-[3.25rem] w-[3.25rem] items-center justify-center rounded-full bg-pro-100 dark:bg-pro-500/[0.15]">
            <Ionicons name="lock-closed" size={22} color={UI_COLORS.pro[500]} />
          </View>
          <View className="rounded-full bg-pro-500 px-2.5 py-[0.1875rem]">
            <ThemedText
              color="inverse"
              weight="bold"
              className="text-[0.6875rem] leading-4 tracking-[0.03125rem]">
              {t('premiumGate.proBadge')}
            </ThemedText>
          </View>
          <ThemedText
            variant="body"
            weight="semibold"
            color="inherit"
            className="text-[0.8125rem] leading-[1.1875rem] text-pro-500">
            {t('premiumGate.unlock')}
          </ThemedText>
        </View>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  blur: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    overflow: 'hidden',
  },
})
