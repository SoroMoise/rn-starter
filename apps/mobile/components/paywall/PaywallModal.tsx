import { PaywallPerks } from '@/components/paywall/PaywallPerks'
import { PaywallPlanCard } from '@/components/paywall/PaywallPlanCard'
import { PriceRetryNotice } from '@/components/paywall/PriceRetryNotice'
import { GradientButton } from '@/components/ui/GradientButton'
import { ThemedText } from '@/components/ui/ThemedText'
import Colors from '@/constants/Colors'
import { LEGAL_URLS } from '@/constants/legal'
import { GRADIENTS } from '@/constants/uiColors'
import { usePremium } from '@/hooks/usePremium'
import { useThemedColor } from '@/hooks/useThemedColor'
import i18n from '@/i18n/service'
import { ModalToastViewport } from '@/providers/ToastProvider'
import { analyticsService } from '@/services/api/analyticsService'
import { openExternalLink } from '@/utils/linking'
import { findSavingsReference, type OfferingPlan } from '@/utils/offerings'
import { computePricePerMonth, computeSavingsPercent, formatPrice } from '@/utils/pricing'
import Ionicons from '@expo/vector-icons/Ionicons'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

// A cycle expressed in whole months reads as "every N months"; anything else
// (a 10-day plan, a 3-week one) falls back to a generic label.
const WHOLE_MONTH_TOLERANCE = 0.01

function wholeMonths(plan: OfferingPlan): number | null {
  const months = plan.monthsPerCycle
  if (months === null) return null
  const rounded = Math.round(months)
  return Math.abs(months - rounded) < WHOLE_MONTH_TOLERANCE ? rounded : null
}

export function PaywallModal({ visible, source, onClose }: PaywallModalProps) {
  const { t } = useTranslation()
  const isDark = useThemedColor()
  const insets = useSafeAreaInsets()
  const { isPremium, isLoadingPurchase, plans, defaultPlan, purchasePlan, restorePurchases } =
    usePremium()

  const heroImage = isDark ? heroDark : heroLight

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) ?? defaultPlan,
    [plans, selectedPlanId, defaultPlan]
  )

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

  // Keyed on id, not object identity — a foreground refetch rebuilds every plan object.
  const defaultPlanId = defaultPlan?.id ?? null
  useEffect(() => {
    setSelectedPlanId(defaultPlanId)
  }, [defaultPlanId])

  const savingsReference = useMemo(() => findSavingsReference(plans), [plans])

  const referencePricePerMonth = useMemo(
    () =>
      savingsReference
        ? computePricePerMonth({
            price: savingsReference.pkg.product.price,
            monthsPerCycle: savingsReference.monthsPerCycle,
          })
        : null,
    [savingsReference]
  )

  const describePlan = useCallback(
    (plan: OfferingPlan): { label: string; billing: string } => {
      switch (plan.period) {
        case 'weekly':
          return { label: t('paywall.planWeekly'), billing: t('paywall.billedWeekly') }
        case 'monthly':
          return { label: t('paywall.planMonthly'), billing: t('paywall.billedMonthly') }
        case 'annual':
          return { label: t('paywall.planAnnual'), billing: t('paywall.billedAnnually') }
        case 'lifetime':
          return { label: t('paywall.planLifetime'), billing: t('paywall.billedOnce') }
        default: {
          const months = wholeMonths(plan)
          if (months !== null && months >= 2) {
            return {
              label: t('paywall.planMonths', { months }),
              billing: t('paywall.billedEveryMonths', { months }),
            }
          }
          return { label: t('paywall.planCustom'), billing: t('paywall.billedRecurring') }
        }
      }
    },
    [t]
  )

  const trialBadgeFor = useCallback(
    (plan: OfferingPlan): string | undefined => {
      if (!plan.hasTrial) return undefined
      return plan.trialDays
        ? t('paywall.trialBadge', { days: plan.trialDays })
        : t('paywall.trialBadgeNoDays')
    },
    [t]
  )

  const ctaLabel = useMemo(() => {
    if (!selectedPlan) return ''
    if (selectedPlan.hasTrial) {
      return selectedPlan.trialDays
        ? t('paywall.ctaTrial', { days: selectedPlan.trialDays })
        : t('paywall.ctaTrialNoDays')
    }
    const price = selectedPlan.pkg.product.priceString
    switch (selectedPlan.period) {
      case 'weekly':
        return t('paywall.ctaSubscribeWeekly', { price })
      case 'monthly':
        return t('paywall.ctaSubscribeMonthly', { price })
      case 'annual':
        return t('paywall.ctaSubscribeAnnual', { price })
      case 'lifetime':
        return t('paywall.ctaBuyLifetime', { price })
      default:
        return t('paywall.ctaSubscribe', { price })
    }
  }, [selectedPlan, t])

  // A one-time purchase is never "renews automatically", and a plan with no price
  // loaded has nothing truthful to say.
  const legalNote = useMemo(() => {
    if (!selectedPlan) return null
    const price = selectedPlan.pkg.product.priceString
    if (selectedPlan.period === 'lifetime') return t('paywall.legalNoteOneTime', { price })
    return t('paywall.legalNoteRecurring', { price })
  }, [selectedPlan, t])

  const handleSubscribe = useCallback(async () => {
    if (!selectedPlan) return
    await purchasePlan({ plan: selectedPlan, source, surface: 'paywall' })
  }, [selectedPlan, purchasePlan, source])

  const handlePlanSelect = useCallback((plan: OfferingPlan) => {
    setSelectedPlanId(plan.id)
    analyticsService.track('paywall_plan_selected', {
      plan: plan.period,
      product_id: plan.pkg.product.identifier,
    })
  }, [])

  const handleClose = () => {
    analyticsService.track('paywall_dismissed', {
      source,
      time_on_paywall_s: Math.round((Date.now() - paywallOpenTimeRef.current) / 1000),
      selected_plan: selectedPlan?.period ?? 'none',
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
          {plans.length === 0 ? (
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
                {plans.map((plan) => {
                  const { label, billing } = describePlan(plan)
                  const product = plan.pkg.product
                  const pricePerMonth = computePricePerMonth({
                    price: product.price,
                    monthsPerCycle: plan.monthsPerCycle,
                  })
                  const savingsPercent =
                    plan.id === savingsReference?.id
                      ? null
                      : computeSavingsPercent({ pricePerMonth, referencePricePerMonth })
                  const showPerMonth = pricePerMonth !== null && (plan.monthsPerCycle ?? 0) > 1

                  return (
                    <PaywallPlanCard
                      key={plan.id}
                      label={label}
                      priceString={product.priceString}
                      periodLabel={
                        showPerMonth
                          ? t('paywall.perMonth', {
                              price: formatPrice({
                                amount: pricePerMonth,
                                currencyCode: product.currencyCode,
                                locale: i18n.language,
                              }),
                            })
                          : billing
                      }
                      savingsBadge={
                        savingsPercent
                          ? t('paywall.savingsBadge', { percent: savingsPercent })
                          : undefined
                      }
                      trialBadge={trialBadgeFor(plan)}
                      isSelected={selectedPlan?.id === plan.id}
                      isDisabled={isLoadingPurchase}
                      onSelect={() => handlePlanSelect(plan)}
                    />
                  )
                })}
              </View>

              {/* CTA */}
              <GradientButton
                onPress={handleSubscribe}
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
