import { Section, SectionContent } from '@/components/settings/SettingsSection'
import { ThemedText } from '@/components/ui/ThemedText'
import { SUBSCRIPTION_GRACE_PERIOD_MS } from '@/constants/purchases'
import { usePremium } from '@/hooks/usePremium'
import { subscriptionStorage } from '@/services/storage/domains/subscription'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity, View } from 'react-native'

export function SubscriptionGraceBanner() {
  const { t, i18n } = useTranslation()
  const { isInGracePeriod, refreshSubscription } = usePremium()

  if (!isInGracePeriod) return null

  const expiresAtMs = subscriptionStorage.getExpiresAt()
  const cutoffMs = expiresAtMs !== null ? expiresAtMs + SUBSCRIPTION_GRACE_PERIOD_MS : null
  const cutoffDate =
    cutoffMs !== null
      ? new Date(cutoffMs).toLocaleDateString(i18n.language, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : ''

  return (
    <Section>
      <SectionContent>
        <View className="flex-row items-start gap-3 px-4 py-3.5">
          <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/20">
            <Ionicons name="warning-outline" size={17} color="#f59e0b" />
          </View>
          <View className="flex-1">
            <ThemedText variant="body" weight="semibold" className="mb-1">
              {t('subscription.graceBannerTitle')}
            </ThemedText>
            <ThemedText variant="label" color="muted" weight="normal" className="mb-3">
              {t('subscription.graceBannerMessage', { date: cutoffDate })}
            </ThemedText>
            <TouchableOpacity
              onPress={() => void refreshSubscription()}
              activeOpacity={0.8}
              className="self-start rounded-full bg-amber-500 px-4 py-1.5">
              <ThemedText color="inherit" weight="semibold" className="text-sm text-white">
                {t('subscription.graceBannerCta')}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </SectionContent>
    </Section>
  )
}
