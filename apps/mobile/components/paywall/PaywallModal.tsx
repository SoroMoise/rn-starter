import { PaywallPerks } from '@/components/paywall/PaywallPerks'
import { PaywallPlanCard } from '@/components/paywall/PaywallPlanCard'
import { PriceRetryNotice } from '@/components/paywall/PriceRetryNotice'
import { GradientButton } from '@/components/ui/GradientButton'
import { ThemedText } from '@/components/ui/ThemedText'
import Colors from '@/constants/Colors'
import { LEGAL_URLS } from '@/constants/legal'
import { GRADIENTS } from '@/constants/uiColors'
import { usePaywallPlans } from '@/hooks/usePaywallPlans'
import { usePremium } from '@/hooks/usePremium'
import { useThemedColor } from '@/hooks/useThemedColor'
import { ModalToastViewport } from '@/providers/ToastProvider'
import { paywallAnalytics } from '@/services/api/paywallAnalytics'
import { openExternalLink } from '@/utils/linking'
import Ionicons from '@expo/vector-icons/Ionicons'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
const heroLight = require('../../assets/images/paywall-illustration-light.webp')
const heroDark = require('../../assets/images/paywall-illustration-dark.webp')

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
  const { isPremium, restorePurchases } = usePremium()
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

  const heroImage = isDark ? heroDark : heroLight

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
          {/* Hero */}
          <View style={styles.heroContainer}>
            <Image source={heroImage} style={styles.heroImage} resizeMode="cover" />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.65)']}
              style={styles.heroOverlay}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}>
              <ThemedText
                variant="title"
                weight="bold"
                color="inverse"
                style={styles.heroOverlayTitle}>
                {t('paywall.title')}
              </ThemedText>
              <ThemedText
                variant="body"
                color="inherit"
                style={[styles.heroOverlaySubtitle, styles.heroOverlayTextMuted]}>
                {t('paywall.subtitle')}
              </ThemedText>
            </LinearGradient>
          </View>

          <View style={styles.perks}>
            <PaywallPerks />
          </View>

          {/* Plan selector */}
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

              {/* CTA */}
              <GradientButton
                onPress={() => void purchaseSelected()}
                colors={GRADIENTS.pro}
                isLoading={isLoadingPurchase}
                disabled={!selectedPlan}
                style={styles.ctaContainer}
                gradientStyle={styles.ctaGradient}>
                <ThemedText color="inherit" style={styles.ctaText}>
                  {ctaLabel}
                </ThemedText>
              </GradientButton>
            </>
          )}

          <ThemedText variant="label" weight="semibold" style={styles.reassurance}>
            {t('paywall.reassurance')}
          </ThemedText>

          {legalNote ? (
            <ThemedText variant="caption" color="muted" style={styles.legalNote}>
              {legalNote}
            </ThemedText>
          ) : null}

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable
              onPress={() => void restorePurchases({ source, surface: 'paywall' })}
              disabled={isLoadingPurchase}
              accessibilityRole="button">
              <ThemedText variant="label" color="muted" style={styles.footerLink}>
                {t('paywall.restore')}
              </ThemedText>
            </Pressable>
            <ThemedText variant="label" color="muted">
              {' · '}
            </ThemedText>
            <Pressable
              onPress={() => void openExternalLink({ url: LEGAL_URLS.TERMS_OF_SERVICE ?? '' })}
              accessibilityRole="link">
              <ThemedText variant="label" color="muted" style={styles.footerLink}>
                {t('settings.termsOfService')}
              </ThemedText>
            </Pressable>
            <ThemedText variant="label" color="muted">
              {' · '}
            </ThemedText>
            <Pressable
              onPress={() => void openExternalLink({ url: LEGAL_URLS.PRIVACY_POLICY ?? '' })}
              accessibilityRole="link">
              <ThemedText variant="label" color="muted" style={styles.footerLink}>
                {t('settings.privacyPolicy')}
              </ThemedText>
            </Pressable>
          </View>
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
  heroContainer: {
    marginHorizontal: -CONTENT_HORIZONTAL_PADDING,
    height: 400,
    overflow: 'hidden',
    marginBottom: 8,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    paddingHorizontal: CONTENT_HORIZONTAL_PADDING,
    paddingBottom: 16,
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 4,
  },
  heroOverlayTitle: {
    fontSize: 22,
    textAlign: 'center',
  },
  heroOverlaySubtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  heroOverlayTextMuted: {
    color: 'rgba(255,255,255,0.75)',
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
  ctaContainer: {
    marginBottom: 2,
  },
  ctaGradient: {
    minHeight: 54,
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  reassurance: {
    textAlign: 'center',
    color: '#10b981',
    marginTop: 12,
    marginBottom: 6,
  },
  legalNote: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 11,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 2,
  },
  footerLink: {
    textDecorationLine: 'underline',
  },
})
