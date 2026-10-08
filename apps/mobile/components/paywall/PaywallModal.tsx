import { LifetimeOfferCard } from '@/components/paywall/LifetimeOfferCard'
import { PAYWALL_HERO_HEIGHT, PaywallHero } from '@/components/paywall/PaywallHero'
import { PaywallLegalLinks } from '@/components/paywall/PaywallLegalLinks'
import { PaywallPerks } from '@/components/paywall/PaywallPerks'
import { PaywallPlanCard } from '@/components/paywall/PaywallPlanCard'
import { PaywallTrustRow } from '@/components/paywall/PaywallTrustRow'
import { PriceRetryNotice } from '@/components/paywall/PriceRetryNotice'
import { GradientButton } from '@/components/ui/GradientButton'
import { ThemedText } from '@/components/ui/ThemedText'
import Colors from '@/constants/Colors'
import { UI_CONFIG } from '@/constants/config'
import { GRADIENTS } from '@/constants/uiColors'
import { usePaywallPlans } from '@/hooks/usePaywallPlans'
import { usePremium } from '@/hooks/usePremium'
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout'
import { useThemedColor } from '@/hooks/useThemedColor'
import { ModalToastViewport } from '@/providers/ToastProvider'
import { paywallAnalytics } from '@/services/api/paywallAnalytics'
import Ionicons from '@expo/vector-icons/Ionicons'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type PaywallModalProps = {
  visible: boolean
  source: string
  onClose: () => void
}

const CONTENT_HORIZONTAL_PADDING = 15
const HERO_MAX_VIEWPORT_RATIO = 0.42

export function PaywallModal({ visible, source, onClose }: PaywallModalProps) {
  const { t } = useTranslation()
  const isDark = useThemedColor()
  const insets = useSafeAreaInsets()
  const { height: screenHeight, isLargeScreen } = useResponsiveLayout()
  const { isPremium, lifetimeOffer } = usePremium()
  const {
    options,
    selectedPlan,
    selectPlan,
    ctaLabel,
    legalNote,
    hasPrices,
    isLoadingPurchase,
    purchaseSelected,
  } = usePaywallPlans({ source, surface: 'paywall' })

  // A short landscape window would hand most of the viewport to the illustration before the plans
  // scroll into view. Gated on width, not height: below 600 dp the portrait lock still holds, and
  // there the hero keeps the height it was drawn at.
  const heroHeight = isLargeScreen
    ? Math.min(PAYWALL_HERO_HEIGHT, screenHeight * HERO_MAX_VIEWPORT_RATIO)
    : PAYWALL_HERO_HEIGHT

  const paywallOpenTimeRef = useRef<number>(0)
  const [isLifetimeOfferVisible, setLifetimeOfferVisible] = useState(false)
  const paywallA11y = isLifetimeOfferVisible ? 'no-hide-descendants' : 'auto'

  // Auto-close once purchase is confirmed
  useEffect(() => {
    if (isPremium && visible) onClose()
  }, [isPremium, visible, onClose])

  useEffect(() => {
    if (visible) {
      paywallOpenTimeRef.current = Date.now()
      setLifetimeOfferVisible(false)
    }
  }, [visible])

  const dismiss = () => {
    paywallAnalytics.trackDismissed({
      source,
      openedAtMs: paywallOpenTimeRef.current,
      selectedPlan: selectedPlan?.period ?? null,
      lifetimeOfferShown: isLifetimeOfferVisible,
    })
    setLifetimeOfferVisible(false)
    onClose()
  }

  const handleClose = () => {
    if (lifetimeOffer && !isLifetimeOfferVisible) {
      setLifetimeOfferVisible(true)
      paywallAnalytics.trackLifetimeOfferShown({ source, plan: lifetimeOffer })
      return
    }
    dismiss()
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}>
      <GestureHandlerRootView style={[styles.container, isDark && styles.containerDark]}>
        <View
          className="absolute inset-x-0 z-10 items-end pb-2"
          style={[styles.header, { top: Math.max(insets.top, 8) }]}
          importantForAccessibility={paywallA11y}>
          <Pressable
            onPress={handleClose}
            className="p-1"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}>
            <View className="h-8 w-8 items-center justify-center rounded-full bg-black/30">
              <Ionicons name="close" size={18} color="#ffffff" />
            </View>
          </Pressable>
        </View>

        <ScrollView
          importantForAccessibility={paywallA11y}
          className="w-full self-center"
          style={styles.scrollColumn}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}>
          <View className="mb-2" style={styles.hero}>
            <PaywallHero
              title={t('paywall.title')}
              subtitle={t('paywall.subtitle')}
              height={heroHeight}
            />
          </View>

          <View className="my-4">
            <PaywallPerks />
          </View>

          {!hasPrices ? (
            // No offer loaded: showing a price that does not exist, behind an active
            // button that silently does nothing, is worse than saying so.
            <View className="py-6">
              <ThemedText variant="body" color="muted" align="center">
                {t('paywall.offerUnavailable')}
              </ThemedText>
              <PriceRetryNotice />
            </View>
          ) : (
            <>
              <View className="mb-5 mt-2" accessibilityRole="radiogroup">
                {options.map((option) => (
                  <PaywallPlanCard
                    key={option.plan.id}
                    label={option.label}
                    priceString={option.plan.pkg.product.priceString}
                    periodLabel={option.caption}
                    savingsBadge={option.savingsBadge ?? undefined}
                    trialBadge={option.trialBadge ?? undefined}
                    isSelected={selectedPlan?.id === option.plan.id}
                    isDisabled={isLoadingPurchase}
                    onSelect={() => selectPlan(option.plan)}
                  />
                ))}
              </View>

              <GradientButton
                onPress={() => void purchaseSelected()}
                colors={GRADIENTS.pro}
                isLoading={isLoadingPurchase}
                disabled={!selectedPlan}
                gradientStyle={styles.ctaGradient}>
                <ThemedText color="inverse" weight="bold">
                  {ctaLabel}
                </ThemedText>
              </GradientButton>

              <View className="mt-3.5">
                <PaywallTrustRow plan={selectedPlan} />
              </View>
            </>
          )}

          {legalNote ? (
            <ThemedText
              variant="caption"
              color="muted"
              align="center"
              className="mb-4 mt-3.5 text-[0.6875rem]">
              {legalNote}
            </ThemedText>
          ) : null}

          <PaywallLegalLinks origin={{ source, surface: 'paywall' }} />
        </ScrollView>
        {isLifetimeOfferVisible && lifetimeOffer ? (
          <LifetimeOfferCard plan={lifetimeOffer} source={source} onDecline={dismiss} />
        ) : null}
        <ModalToastViewport active={visible} />
      </GestureHandlerRootView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.screenBackground,
  },
  containerDark: {
    backgroundColor: Colors.dark.screenBackground,
  },
  header: {
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
  },
  // The modal is its own window, outside ScreenContainer's column, so it caps itself. Capping the
  // scroll view rather than its content keeps the hero's full-bleed margin on the column's edge.
  scrollColumn: {
    maxWidth: UI_CONFIG.MAX_CONTENT_WIDTH,
  },
  scroll: {
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
  },
  hero: {
    marginHorizontal: -CONTENT_HORIZONTAL_PADDING,
  },
  ctaGradient: {
    minHeight: 54,
  },
})
