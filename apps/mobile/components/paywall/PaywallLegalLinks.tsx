import { ThemedText } from '@/components/ui/ThemedText'
import { LEGAL_URLS } from '@/constants/legal'
import type { PurchaseOrigin } from '@/constants/purchases'
import { usePremium } from '@/hooks/usePremium'
import { openExternalLink } from '@/utils/linking'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

export function PaywallLegalLinks({ origin }: { origin: PurchaseOrigin }) {
  const { t } = useTranslation()
  const { isLoadingPurchase, restorePurchases } = usePremium()

  return (
    <View className="flex-row flex-wrap items-center justify-center gap-x-4 gap-y-1">
      <Pressable
        onPress={() => void restorePurchases(origin)}
        disabled={isLoadingPurchase}
        hitSlop={8}
        accessibilityRole="button">
        <ThemedText variant="label" color="muted" className="underline">
          {t('paywall.restore')}
        </ThemedText>
      </Pressable>
      <Pressable
        onPress={() => void openExternalLink({ url: LEGAL_URLS.TERMS_OF_SERVICE ?? '' })}
        hitSlop={8}
        accessibilityRole="link">
        <ThemedText variant="label" color="muted" className="underline">
          {t('settings.termsOfService')}
        </ThemedText>
      </Pressable>
      <Pressable
        onPress={() => void openExternalLink({ url: LEGAL_URLS.PRIVACY_POLICY ?? '' })}
        hitSlop={8}
        accessibilityRole="link">
        <ThemedText variant="label" color="muted" className="underline">
          {t('settings.privacyPolicy')}
        </ThemedText>
      </Pressable>
    </View>
  )
}
