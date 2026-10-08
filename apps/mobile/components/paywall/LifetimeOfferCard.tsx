import { GradientButton } from '@/components/ui/GradientButton'
import { ThemedText } from '@/components/ui/ThemedText'
import { UI_CONFIG } from '@/constants/config'
import { GRADIENTS, UI_COLORS } from '@/constants/uiColors'
import { planCtaLabel, planLegalNote } from '@/hooks/usePaywallPlans'
import { usePremium } from '@/hooks/usePremium'
import type { OfferingPlan } from '@/utils/offerings'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTranslation } from 'react-i18next'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type LifetimeOfferCardProps = {
  plan: OfferingPlan
  source: string
  onDecline: () => void
}

export function LifetimeOfferCard({ plan, source, onDecline }: LifetimeOfferCardProps) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { isLoadingPurchase, purchasePlan } = usePremium()
  const ctaLabel = planCtaLabel({ plan, t })

  return (
    <View style={[StyleSheet.absoluteFill, styles.layer, { paddingTop: insets.top }]}>
      <Animated.View entering={FadeIn.duration(180)} style={StyleSheet.absoluteFill}>
        <Pressable
          className="absolute inset-0 bg-black/50"
          onPress={onDecline}
          disabled={isLoadingPurchase}
          accessible={false}
          importantForAccessibility="no"
        />
      </Animated.View>

      <Animated.View
        entering={SlideInDown.duration(260)}
        accessibilityViewIsModal
        style={styles.card}>
        <View className="shrink overflow-hidden rounded-t-3xl bg-gray-50 dark:bg-gray-900">
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingTop: 24,
              paddingBottom: Math.max(insets.bottom, 16) + 8,
            }}
            showsVerticalScrollIndicator={false}>
            <View
              className="mb-4 h-14 w-14 items-center justify-center self-center rounded-full bg-pro-500/20"
              importantForAccessibility="no-hide-descendants">
              <Ionicons name="infinite" size={28} color={UI_COLORS.pro[500]} />
            </View>

            <ThemedText variant="title" align="center">
              {t('paywall.lifetimeOffer.title')}
            </ThemedText>
            <ThemedText variant="body" color="muted" align="center" className="mt-3">
              {t('paywall.lifetimeOffer.body')}
            </ThemedText>

            <GradientButton
              onPress={() => void purchasePlan({ plan, source, surface: 'lifetime_offer' })}
              colors={GRADIENTS.pro}
              isLoading={isLoadingPurchase}
              style={styles.cta}
              gradientStyle={styles.ctaGradient}
              accessibilityLabel={ctaLabel}>
              <ThemedText variant="button" color="inverse" align="center">
                {ctaLabel}
              </ThemedText>
            </GradientButton>

            <ThemedText variant="caption" color="muted" align="center" className="mt-3">
              {planLegalNote({ plan, t })}
            </ThemedText>

            <Pressable
              onPress={onDecline}
              disabled={isLoadingPurchase}
              className="mt-3 py-2"
              accessibilityRole="button">
              <ThemedText variant="body" color="muted" align="center" className="underline">
                {t('paywall.lifetimeOffer.decline')}
              </ThemedText>
            </Pressable>
          </ScrollView>
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  layer: {
    justifyContent: 'flex-end',
  },
  card: {
    width: '100%',
    maxWidth: UI_CONFIG.MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    flexShrink: 1,
  },
  scroll: {
    flexGrow: 0,
  },
  cta: {
    marginTop: 24,
    borderRadius: 14,
  },
  ctaGradient: {
    minHeight: 54,
    paddingHorizontal: 16,
  },
})
