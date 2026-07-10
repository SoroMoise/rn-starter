import { PaywallPlanCard } from '@/components/paywall/PaywallPlanCard'
import { GradientButton } from '@/components/ui/GradientButton'
import { ThemedText } from '@/components/ui/ThemedText'
import Colors from '@/constants/Colors'
import { LEGAL_URLS } from '@/constants/legal'
import {
  FREE_FEATURES,
  PREMIUM_FEATURES,
  PlanType,
  TRIAL_DURATION_DAYS,
} from '@/constants/purchases'
import { SOCIAL_PROOF } from '@/constants/socialProof'
import { usePremium } from '@/hooks/usePremium'
import { useThemedColor } from '@/hooks/useThemedColor'
import i18n from '@/i18n/service'
import { ModalToastViewport } from '@/providers/ToastProvider'
import { analyticsService } from '@/services/api/analyticsService'
import { openExternalLink } from '@/utils/linking'
import { computeSavingsPercent, formatMonthlyPrice } from '@/utils/pricing'
import Ionicons from '@expo/vector-icons/Ionicons'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
const heroLight = require('../../assets/images/paywall-illustration-light.png')
const heroDark = require('../../assets/images/paywall-illustration-dark.png')

type PaywallModalProps = {
  visible: boolean
  source: string
  onClose: () => void
}

const CONTENT_HORIZONTAL_PADDING = 15

const COMPARISON_ROWS = [
  ...FREE_FEATURES.map((feature) => ({ ...feature, freeIncluded: true })),
  ...PREMIUM_FEATURES.map((feature) => ({ ...feature, freeIncluded: false })),
]

export function PaywallModal({ visible, source, onClose }: PaywallModalProps) {
  const { t } = useTranslation()
  const isDark = useThemedColor()
  const insets = useSafeAreaInsets()
  const {
    isPremium,
    isLoadingPurchase,
    monthlyPackage,
    annualPackage,
    purchaseMonthly,
    purchaseAnnual,
    restorePurchases,
  } = usePremium()

  const heroImage = isDark ? heroDark : heroLight

  const [selectedPlan, setSelectedPlan] = useState<PlanType>('annual')

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

  const savingsPercent = useMemo(
    () =>
      computeSavingsPercent({
        monthlyPrice: monthlyPackage?.product.price,
        annualPrice: annualPackage?.product.price,
      }),
    [monthlyPackage, annualPackage]
  )

  const annualPerMonthLabel = useMemo(() => {
    const product = annualPackage?.product
    if (!product) return null
    const price = formatMonthlyPrice({
      annualPrice: product.price,
      currencyCode: product.currencyCode,
      locale: i18n.language,
    })
    return t('paywall.perMonth', { price })
  }, [annualPackage, t])

  const handleSubscribe = useCallback(async () => {
    if (selectedPlan === 'annual') {
      await purchaseAnnual()
    } else {
      await purchaseMonthly()
    }
  }, [selectedPlan, purchaseAnnual, purchaseMonthly])

  const ctaLabel = useMemo(() => {
    if (selectedPlan === 'annual') {
      const hasIntroOffer = !!annualPackage?.product.introPrice
      return hasIntroOffer
        ? t('paywall.ctaTrial', { days: TRIAL_DURATION_DAYS })
        : t('paywall.ctaSubscribeAnnual', { price: annualPackage?.product.priceString ?? '' })
    }
    return t('paywall.ctaSubscribeMonthly', {
      price: monthlyPackage?.product.priceString ?? '',
    })
  }, [selectedPlan, annualPackage, monthlyPackage, t])

  const monthlyPeriodLabel = t('paywall.billedMonthly')

  const handlePlanSelect = (plan: PlanType) => {
    setSelectedPlan(plan)
    analyticsService.track('paywall_plan_selected', { plan })
  }

  const handleClose = () => {
    analyticsService.track('paywall_dismissed', {
      source,
      time_on_paywall_s: Math.round((Date.now() - paywallOpenTimeRef.current) / 1000),
      selected_plan: selectedPlan,
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
              <View style={styles.socialProof}>
                <ThemedText variant="caption" color="inherit" style={styles.socialProofText}>
                  {t('paywall.socialProof', {
                    rating: SOCIAL_PROOF.rating,
                    users: SOCIAL_PROOF.usersLabel,
                  })}
                </ThemedText>
              </View>
            </LinearGradient>
          </View>

          {/* Free vs Pro comparison */}
          <View style={[styles.compareCard, isDark && styles.compareCardDark]}>
            <View style={[styles.compareRow, styles.compareHead]}>
              <ThemedText variant="caption" color="muted" style={styles.compareFeatureCol}>
                {t('paywall.compareHeaderFeature')}
              </ThemedText>
              <ThemedText variant="caption" color="muted" style={styles.compareHeadCol}>
                {t('paywall.compareHeaderFree')}
              </ThemedText>
              <ThemedText variant="caption" color="muted" style={styles.compareHeadCol}>
                {t('paywall.compareHeaderPro')}
              </ThemedText>
            </View>
            {COMPARISON_ROWS.map((feature, index) => (
              <View
                key={feature.key}
                style={[
                  styles.compareRow,
                  index < COMPARISON_ROWS.length - 1 && styles.featureRowBorder,
                  index < COMPARISON_ROWS.length - 1 && isDark && styles.featureRowBorderDark,
                ]}>
                <ThemedText variant="label" weight="medium" style={styles.compareFeatureCol}>
                  {t(feature.i18nKey)}
                </ThemedText>
                <View style={styles.compareCol}>
                  {feature.freeIncluded ? (
                    <Ionicons name="checkmark" size={18} color="#10b981" />
                  ) : (
                    <Ionicons name="close" size={16} color={isDark ? '#4b5563' : '#cbd5e1'} />
                  )}
                </View>
                <View style={styles.compareCol}>
                  <Ionicons name="checkmark" size={18} color="#10b981" />
                </View>
              </View>
            ))}
          </View>

          {/* Plan selector */}
          <View style={styles.plans}>
            <PaywallPlanCard
              type="annual"
              label={t('paywall.planAnnual')}
              priceString={annualPackage?.product.priceString ?? '—'}
              periodLabel={annualPerMonthLabel ?? t('paywall.billedAnnually')}
              savingsBadge={
                savingsPercent ? t('paywall.savingsBadge', { percent: savingsPercent }) : undefined
              }
              trialBadge={t('paywall.trialBadge', { days: TRIAL_DURATION_DAYS })}
              isSelected={selectedPlan === 'annual'}
              isDisabled={isLoadingPurchase}
              onSelect={() => handlePlanSelect('annual')}
            />
            <PaywallPlanCard
              type="monthly"
              label={t('paywall.planMonthly')}
              priceString={monthlyPackage?.product.priceString ?? '—'}
              periodLabel={monthlyPeriodLabel}
              isSelected={selectedPlan === 'monthly'}
              isDisabled={isLoadingPurchase}
              onSelect={() => handlePlanSelect('monthly')}
            />
          </View>

          {/* CTA */}
          <GradientButton
            onPress={handleSubscribe}
            colors={['#7c3aed', '#6d28d9']}
            isLoading={isLoadingPurchase}
            style={styles.ctaContainer}
            gradientStyle={styles.ctaGradient}>
            <ThemedText color="inherit" style={styles.ctaText}>
              {ctaLabel}
            </ThemedText>
          </GradientButton>

          <ThemedText variant="label" weight="semibold" style={styles.reassurance}>
            {t('paywall.reassurance')}
          </ThemedText>

          <ThemedText variant="caption" color="muted" style={styles.legalNote}>
            {selectedPlan === 'annual'
              ? t('paywall.legalNoteAnnual', { price: annualPackage?.product.priceString ?? '' })
              : t('paywall.legalNoteMonthly', {
                  price: monthlyPackage?.product.priceString ?? '',
                })}
          </ThemedText>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable
              onPress={restorePurchases}
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
  featureRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DBDBDB',
  },
  featureRowBorderDark: {
    borderBottomColor: '#374151',
  },
  compareCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    marginVertical: 16,
    overflow: 'hidden',
  },
  compareCardDark: {
    backgroundColor: Colors.dark.card,
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  compareHead: {
    backgroundColor: 'rgba(139,92,246,0.06)',
  },
  compareFeatureCol: {
    flex: 1,
  },
  compareCol: {
    width: 52,
    alignItems: 'center',
  },
  compareHeadCol: {
    width: 52,
    textAlign: 'center',
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
  socialProof: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
  },
  socialProofText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
})
