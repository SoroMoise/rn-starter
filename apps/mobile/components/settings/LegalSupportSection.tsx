import {
  Divider,
  Section,
  SectionContent,
  SectionHeader,
} from '@/components/settings/SettingsSection'
import { LEGAL_URLS } from '@/constants/legal'
import { analyticsService } from '@/services/api/analyticsService'
import { consentService } from '@/services/api/consentService'
import { useAdsConsent } from '@/hooks/useAdsConsent'
import { openStoreListing } from '@/services/api/ratingService'
import { SettingsLinkRow, type SettingsLinkRowProps } from '@components/ui/SettingsLinkRow'
import { openExternalLink } from '@/utils/linking'
import { Fragment, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

type LegalSupportItem = {
  id: string
  icon: SettingsLinkRowProps['icon']
  label: string
  onPress: () => void
}

export function LegalSupportSection() {
  const { t } = useTranslation()
  const { arePrivacyOptionsRequired } = useAdsConsent()
  const legalSupportItems = useMemo<LegalSupportItem[]>(
    () => [
      {
        id: 'privacy',
        icon: 'shield-checkmark-outline',
        label: t('settings.privacyPolicy'),
        onPress: () => {
          analyticsService.track('external_link_opened', { link_type: 'privacy_policy' })
          void openExternalLink({ url: LEGAL_URLS.PRIVACY_POLICY! })
        },
      },
      {
        id: 'terms',
        icon: 'document-text-outline',
        label: t('settings.termsOfService'),
        onPress: () => {
          analyticsService.track('external_link_opened', { link_type: 'terms_of_service' })
          void openExternalLink({ url: LEGAL_URLS.TERMS_OF_SERVICE! })
        },
      },
      {
        id: 'support',
        icon: 'mail-outline',
        label: t('settings.support'),
        onPress: () => {
          analyticsService.track('external_link_opened', { link_type: 'support' })
          void openExternalLink({ url: LEGAL_URLS.SUPPORT_EMAIL! })
        },
      },
      {
        id: 'rate',
        icon: 'star-outline',
        label: t('settings.rateApp'),
        // An explicit tap opens the listing, never the native card: Play enforces
        // an undocumented quota on it and forbids wiring it to a button.
        onPress: () => {
          analyticsService.track('rate_app_clicked')
          void openStoreListing({ reason: 'settings' })
        },
      },
      // Rendered only where Google requires the choice to be reopenable — absent
      // rather than opening nothing.
      ...(arePrivacyOptionsRequired
        ? [
            {
              id: 'adPrivacy',
              icon: 'options-outline' as const,
              label: t('settings.adPrivacy'),
              onPress: () => {
                analyticsService.track('ad_privacy_options_opened')
                void consentService.showPrivacyOptions()
              },
            },
          ]
        : []),
    ],
    [t, arePrivacyOptionsRequired]
  )

  return (
    <Section>
      <SectionHeader>{t('settings.legalAndSupport')}</SectionHeader>
      <SectionContent>
        {legalSupportItems.map((item, index) => (
          <Fragment key={item.id}>
            {index > 0 ? <Divider /> : null}
            <SettingsLinkRow icon={item.icon} label={item.label} onPress={item.onPress} />
          </Fragment>
        ))}
      </SectionContent>
    </Section>
  )
}
