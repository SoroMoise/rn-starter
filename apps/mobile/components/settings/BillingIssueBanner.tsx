import { Section, SectionContent } from '@/components/settings/SettingsSection'
import { ThemedText } from '@/components/ui/ThemedText'
import { usePremium } from '@/hooks/usePremium'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

export function BillingIssueBanner() {
  const { t, i18n } = useTranslation()
  const { billingIssue } = usePremium()

  if (!billingIssue) return null

  const date = new Date(billingIssue.accessEndsAtMs).toLocaleDateString(i18n.language, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <Section>
      <SectionContent>
        <View className="flex-row items-start gap-3 px-4 py-3.5">
          <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/20">
            <Ionicons name="card-outline" size={17} color="#f59e0b" />
          </View>
          <View className="flex-1">
            <ThemedText variant="body" weight="semibold" className="mb-1">
              {t('subscription.billingIssueTitle')}
            </ThemedText>
            <ThemedText variant="label" color="muted" weight="normal">
              {t('subscription.billingIssueMessage', { date })}
            </ThemedText>
          </View>
        </View>
      </SectionContent>
    </Section>
  )
}
