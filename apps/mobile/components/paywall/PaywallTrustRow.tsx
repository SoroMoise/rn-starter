import { ThemedText } from '@/components/ui/ThemedText'
import { useThemedColor } from '@/hooks/useThemedColor'
import type { OfferingPlan } from '@/utils/offerings'
import Ionicons from '@expo/vector-icons/Ionicons'
import type { ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, View } from 'react-native'

type TrustItem = { icon: ComponentProps<typeof Ionicons>['name']; text: string }

const STORE_NAME = Platform.OS === 'ios' ? 'App Store' : 'Google Play'

// Each line holds for the plan it sits under: a one-time purchase has nothing to cancel, and
// only a free trial is free during its trial.
export function PaywallTrustRow({ plan }: { plan: OfferingPlan | null }) {
  const { t } = useTranslation()
  const isDark = useThemedColor()

  if (!plan) return null

  const items: TrustItem[] = [
    { icon: 'shield-checkmark-outline', text: t('paywall.trustStore', { store: STORE_NAME }) },
  ]
  if (plan.period === 'lifetime') {
    items.push({ icon: 'infinite-outline', text: t('paywall.trustOneTime') })
  } else {
    if (plan.hasTrial) items.push({ icon: 'gift-outline', text: t('paywall.trustTrial') })
    items.push({ icon: 'close-circle-outline', text: t('paywall.trustCancel') })
  }

  return (
    <View className="gap-2 px-1">
      {items.map((item) => (
        <View key={item.icon} className="flex-row items-center gap-2">
          <Ionicons name={item.icon} size={14} color={isDark ? '#9ca3af' : '#6b7280'} />
          <ThemedText variant="caption" color="muted" className="flex-1">
            {item.text}
          </ThemedText>
        </View>
      ))}
    </View>
  )
}
