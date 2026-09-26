import { PaywallHero } from '@/components/paywall/PaywallHero'
import { PaywallLegalLinks } from '@/components/paywall/PaywallLegalLinks'
import { PaywallPerks } from '@/components/paywall/PaywallPerks'
import { PaywallPlanCard } from '@/components/paywall/PaywallPlanCard'
import { PaywallTrustRow } from '@/components/paywall/PaywallTrustRow'
import { PriceRetryNotice } from '@/components/paywall/PriceRetryNotice'
import { GradientButton } from '@/components/ui/GradientButton'
import { ThemedText } from '@/components/ui/ThemedText'
import Colors from '@/constants/Colors'
import { GRADIENTS } from '@/constants/uiColors'
import { usePaywallPlans } from '@/hooks/usePaywallPlans'
import { usePremium } from '@/hooks/usePremium'
import { useThemedColor } from '@/hooks/useThemedColor'
import { ModalToastViewport } from '@/providers/ToastProvider'
import { paywallAnalytics } from '@/services/api/paywallAnalytics'
import Ionicons from '@expo/vector-icons/Ionicons'
import React, { useEffect, useRef } from 'react'
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

export function PaywallModal({ visible, source, onClose }: PaywallModalProps) {
  const { t } = useTranslation()
  const isDark = useThemedColor()
  const insets = useSafeAreaInsets()
  const { isPremium } = usePremium()
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

  const paywallOpenTimeRef = useRef<number>(0)

  // Auto-close once purchase is confirmed
  useEffect(() => {
    if (isPremium && visible) onClose()
  }, [isPremium, visible, onClose])

  useEffect(() => {
    if (visible) {
      paywallOpenTimeRef.current = Date.now()
    }
  }, [visible])

  const handleClose = () => {
    paywallAnalytics.trackDismissed({
      source,
      openedAtMs: paywallOpenTimeRef.current,
      selectedPlan: selectedPlan?.period ?? null,
    })
    onClose()
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}>
      <GestureHandlerRootView style={[styles.container, isDark && styles.containerDark]}>
        {/* Close button floating over hero image */}
        <View style={[styles.header, { top: Math.max(insets.top, 8) }]}>
          <Pressable
            onPress={handleClose}
            style={styles.closeButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}>
            <View style={styles.closeCircle}>
              <Ionicons name="close" size={18} color="#ffffff" />
            </View>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <PaywallHero title={t('paywall.title')} subtitle={t('paywall.subtitle')} />
          </View>

          <View style={styles.perks}>
            <PaywallPerks />
          </View>

          {!hasPrices ? (
            // No offer loaded: showing a price that does not exist, behind an active
            // button that silently does nothing, is worse than saying so.
            <View style={styles.offerUnavailable}>
              <ThemedText variant="body" color="muted" align="center">
                {t('paywall.offerUnavailable')}
              </ThemedText>
              <PriceRetryNotice />
            </View>
          ) : (
            <>
              <View style={styles.plans}>
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
                <ThemedText color="inherit" style={styles.ctaText}>
                  {ctaLabel}
                </ThemedText>
              </GradientButton>

              <View style={styles.trust}>
                <PaywallTrustRow plan={selectedPlan} />
              </View>
            </>
          )}

          {legalNote ? (
            <ThemedText variant="caption" color="muted" style={styles.legalNote}>
              {legalNote}
            </ThemedText>
          ) : null}

          <PaywallLegalLinks origin={{ source, surface: 'paywall' }} />
        </ScrollView>
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
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingBottom: 8,
    alignItems: 'flex-end',
  },
  closeButton: {
    padding: 4,
  },
  closeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
  },
  hero: {
    marginHorizontal: -CONTENT_HORIZONTAL_PADDING,
    marginBottom: 8,
  },
  perks: {
    marginVertical: 16,
  },
  offerUnavailable: {
    paddingVertical: 24,
  },
  plans: {
    marginTop: 8,
    marginBottom: 20,
  },
  ctaGradient: {
    minHeight: 54,
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  trust: {
    marginTop: 14,
  },
  legalNote: {
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 16,
    fontSize: 11,
  },
})
