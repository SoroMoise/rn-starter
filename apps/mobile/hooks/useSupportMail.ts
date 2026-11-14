import { LEGAL_URLS } from '@/constants/legal'
import { buildSupportMailto, readSupportDiagnostics } from '@/services/support/supportMail'
import { openExternalLink } from '@/utils/linking'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

export function useSupportMail() {
  const { t, i18n } = useTranslation()

  return useCallback(
    () =>
      openExternalLink({
        url: buildSupportMailto({
          mailtoUrl: LEGAL_URLS.SUPPORT_EMAIL,
          subject: t('support.mailSubject', { appName: t('common.appName') }),
          firstLine: t('support.mailFirstLine'),
          diagnostics: readSupportDiagnostics({ language: i18n.language }),
        }),
      }),
    [t, i18n]
  )
}
