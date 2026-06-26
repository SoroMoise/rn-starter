import { GradientButton } from '@/components/ui/GradientButton'
import { ModalBottomSheet } from '@/components/ui/ModalBottomSheet'
import { ThemedText } from '@/components/ui/ThemedText'
import { usePremium } from '@/hooks/usePremium'
import { triggerLight } from '@/utils/haptics'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface ExitIntentSheetProps {
  visible: boolean
  onRecovered: () => void
  onConfirmedSkip: () => void
  onDismissedOutside: () => void
}

export function ExitIntentSheet({
  visible,
  onRecovered,
  onConfirmedSkip,
  onDismissedOutside,
}: ExitIntentSheetProps) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { purchaseAnnual, isLoadingPurchase, annualPackage, isPremium } = usePremium()
  const isPremiumRef = useRef(isPremium)
  useEffect(() => {
    isPremiumRef.current = isPremium
  }, [isPremium])

  const handleStart = useCallback(() => {
    if (!annualPackage || isLoadingPurchase) return
    triggerLight()
    void purchaseAnnual().then(() => {
      if (isPremiumRef.current) onRecovered()
    })
  }, [annualPackage, isLoadingPurchase, purchaseAnnual, onRecovered])

  const handleSkip = useCallback(() => {
    triggerLight()
    onConfirmedSkip()
  }, [onConfirmedSkip])

  return (
    <ModalBottomSheet
      visible={visible}
      onClose={onDismissedOutside}
      title=""
      showCloseButton={false}
      compact>
      <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: insets.bottom + 40 }}>
        <View className="mb-4 h-14 w-14 items-center justify-center self-center rounded-full bg-violet-500/20">
          <Ionicons name="time-outline" size={28} color="#8b5cf6" />
        </View>
        <ThemedText variant="display" align="center" className="text-2xl">
          {t('onboarding.exitIntent.title')}
        </ThemedText>
        <ThemedText variant="body" color="muted" align="center" className="mt-3">
          {t('onboarding.exitIntent.body')}
        </ThemedText>

        <GradientButton
          onPress={handleStart}
          isLoading={isLoadingPurchase}
          disabled={!annualPackage}
          colors={['#3b82f6', '#6366f1', '#8b5cf6']}
          style={{ height: 56, borderRadius: 14, marginTop: 24 }}
          gradientStyle={{ height: '100%' }}
          accessibilityLabel={t('onboarding.exitIntent.ctaStart')}>
          <ThemedText variant="buttonLarge" color="inverse">
            {t('onboarding.exitIntent.ctaStart')}
          </ThemedText>
        </GradientButton>

        <Pressable
          onPress={handleSkip}
          disabled={isLoadingPurchase}
          className="mt-3 py-2"
          accessibilityRole="button">
          <ThemedText variant="body" color="muted" align="center" className="underline">
            {t('onboarding.exitIntent.ctaSkip')}
          </ThemedText>
        </Pressable>
      </View>
    </ModalBottomSheet>
  )
}
