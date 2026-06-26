import {
  Divider,
  Section,
  SectionContent,
  SectionHeader,
} from '@/components/settings/SettingsSection'
import { RatingModal } from '@/components/ui/RatingModal'
import { MIN_STARS_FOR_STORE_REDIRECT } from '@/constants/rating'
import { LEGAL_URLS } from '@/constants/legal'
import { analyticsService } from '@/services/api/analyticsService'
import { conversionStorage } from '@/services/storage/domains/conversion'
import { requestStoreReview } from '@/services/api/ratingService'
import { SettingsLinkRow, type SettingsLinkRowProps } from '@components/ui/SettingsLinkRow'
import { openExternalLink } from '@/utils/linking'
import { Fragment, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'

type LegalSupportItem = {
  id: string
  icon: SettingsLinkRowProps['icon']
  label: string
  onPress: () => void
}

export function LegalSupportSection() {
  const { t } = useTranslation()
  const [ratingModalVisible, setRatingModalVisible] = useState(false)

  const closeRatingModal = useCallback(() => setRatingModalVisible(false), [])

  const handleRatingLater = useCallback(() => {
    closeRatingModal()
    analyticsService.track('rating_later', { source: 'manual' })
  }, [closeRatingModal])

  const handleRatingSubmit = useCallback(
    async (stars: number) => {
      closeRatingModal()
      const conversionCount = conversionStorage.getTotalSuccessful()
      analyticsService.track('rating_submitted', {
        stars,
        source: 'manual',
        conversion_count: conversionCount,
      })
      if (stars >= MIN_STARS_FOR_STORE_REDIRECT) {
        await requestStoreReview()
      } else {
        Alert.alert(t('common.appName'), t('appRating.thankYou'), [{ text: t('common.ok') }], {
          cancelable: true,
        })
      }
    },
    [closeRatingModal, t]
  )

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
        onPress: () => {
          analyticsService.track('rate_app_clicked')
          analyticsService.track('rating_modal_shown', { source: 'manual', conversion_count: 0 })
          setRatingModalVisible(true)
        },
      },
    ],
    [t]
  )

  return (
    <>
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

      <RatingModal
        visible={ratingModalVisible}
        promptTitle={t('appRating.settingsTitle')}
        promptMessage={t('appRating.settingsMessage')}
        onLater={handleRatingLater}
        onRate={handleRatingSubmit}
      />
    </>
  )
}
