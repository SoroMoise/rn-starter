import { RewardedAdButton } from '@/components/ads/RewardedAdButton'
import { Section, SectionContent, SectionHeader } from '@/components/settings/SettingsSection'
import { ThemedText } from '@/components/ui/ThemedText'
import { ADMOB_REWARDED_ID, AD_REWARDED_ENABLED } from '@/constants/admob'
import { useCanServeAd } from '@/hooks/useCanServeAd'
import { useTranslation } from 'react-i18next'

export function AdFreeSection() {
  const { t } = useTranslation()
  const canServe = useCanServeAd({ unitId: ADMOB_REWARDED_ID, enabled: AD_REWARDED_ENABLED })

  if (!canServe) return null

  return (
    <Section>
      <SectionHeader>{t('settings.ads')}</SectionHeader>
      <SectionContent className="p-4">
        <ThemedText variant="body" weight="medium" className="mb-1">
          {t('settings.removeAds')}
        </ThemedText>
        <ThemedText variant="label" color="muted" weight="normal" className="mb-4">
          {t('settings.removeAdsDescription')}
        </ThemedText>
        <RewardedAdButton />
      </SectionContent>
    </Section>
  )
}
