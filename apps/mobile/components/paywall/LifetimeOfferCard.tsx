import { GradientButton } from '@/components/ui/GradientButton'
import { ThemedText } from '@/components/ui/ThemedText'
import Colors from '@/constants/Colors'
import { UI_CONFIG } from '@/constants/config'
import { GRADIENTS, UI_COLORS } from '@/constants/uiColors'
import { useThemedColor } from '@/hooks/useThemedColor'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTranslation } from 'react-i18next'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type LifetimeOfferCardProps = {
  ctaLabel: string
  legalNote: string
  isLoading: boolean
  onPurchase: () => void
  onDecline: () => void
}

export function LifetimeOfferCard({
  ctaLabel,
  legalNote,
  isLoading,
  onPurchase,
  onDecline,
}: LifetimeOfferCardProps) {
  const { t } = useTranslation()
  const isDark = useThemedColor()
  const insets = useSafeAreaInsets()

  return (
    <View style={[StyleSheet.absoluteFill, styles.layer, { paddingTop: insets.top }]}>
      <Animated.View entering={FadeIn.duration(180)} style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={isLoading ? undefined : onDecline}
          accessible={false}
          importantForAccessibility="no"
        />
      </Animated.View>

      <Animated.View
        entering={SlideInDown.duration(260)}
        accessibilityViewIsModal
        style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, 16) + 8 },
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.iconCircle} importantForAccessibility="no-hide-descendants">
            <Ionicons name="infinite" size={22} color="#ffffff" />
          </View>

          <ThemedText variant="title" align="center">
            {t('paywall.lifetimeOffer.title')}
          </ThemedText>

          <ThemedText variant="body" color="muted" align="center">
            {t('paywall.lifetimeOffer.body')}
          </ThemedText>

          <GradientButton
            onPress={onPurchase}
            colors={GRADIENTS.pro}
            isLoading={isLoading}
            style={styles.cta}
            gradientStyle={styles.ctaGradient}
            accessibilityLabel={ctaLabel}>
            <ThemedText variant="button" color="inverse" align="center">
              {ctaLabel}
            </ThemedText>
          </GradientButton>

          <ThemedText variant="caption" color="muted" align="center">
            {legalNote}
          </ThemedText>

          <Pressable
            onPress={onDecline}
            disabled={isLoading}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityState={{ disabled: isLoading }}
            style={styles.decline}>
            <ThemedText variant="label" color="muted" align="center" className="underline">
              {t('paywall.lifetimeOffer.decline')}
            </ThemedText>
          </Pressable>
        </ScrollView>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  layer: {
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  card: {
    width: '100%',
    maxWidth: UI_CONFIG.MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    flexShrink: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  cardLight: {
    backgroundColor: Colors.light.background,
  },
  cardDark: {
    backgroundColor: Colors.dark.card,
  },
  scroll: {
    flexGrow: 0,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 12,
  },
  iconCircle: {
    alignSelf: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: UI_COLORS.pro[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: {
    marginTop: 8,
    borderRadius: 14,
  },
  ctaGradient: {
    minHeight: 54,
    paddingHorizontal: 16,
  },
  decline: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
})
