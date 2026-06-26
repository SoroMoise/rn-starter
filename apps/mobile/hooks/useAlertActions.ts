import { useToast } from '@/providers/ToastProvider'
import { useAlertsStore } from '@/stores/alertsStore'
import { useSettingsStore } from '@/stores/settingsStore'
import type { RateAlert } from '@/types'
import { isThresholdAlert } from '@/types'
import { buildRecreateParams } from '@/utils/alertRecreate'
import { formatAlertRate } from '@/utils/formatters'
import { triggerLight, triggerMedium, triggerSuccess, triggerWarning } from '@/utils/haptics'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'

export function useAlertActions() {
  const { t, i18n } = useTranslation()
  const { showToast } = useToast()
  const decimals = useSettingsStore((s) => s.settings.decimals)
  const deleteAlert = useAlertsStore((s) => s.deleteAlert)
  const createAlert = useAlertsStore((s) => s.createAlert)

  const confirmDelete = (alertId: string) => {
    triggerMedium()
    Alert.alert(
      t('alerts.deleteConfirmTitle'),
      t('alerts.deleteConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('alerts.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              triggerWarning()
              await deleteAlert({ alertId })
              showToast({ message: t('alerts.deleteSuccess'), type: 'success' })
            } catch {
              showToast({ message: t('error.unknownError'), type: 'error' })
            }
          },
        },
      ],
      { cancelable: true }
    )
  }

  const confirmRecreate = ({ alert, onSuccess }: { alert: RateAlert; onSuccess?: () => void }) => {
    triggerLight()
    const pair = `${alert.fromCurrency}/${alert.toCurrency}`
    const message = isThresholdAlert(alert)
      ? t('alerts.recreateConfirmMessage', {
          pair,
          direction: alert.direction === 'above' ? t('alerts.above') : t('alerts.below'),
          rate: alert.targetRate,
        })
      : t('alerts.recreateConfirmMessageVariation', {
          pair,
          percent: alert.variationPercent,
          rate: alert.baselineRate,
        })

    Alert.alert(
      t('alerts.recreateConfirmTitle'),
      message,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('alerts.recreate'),
          onPress: async () => {
            try {
              await createAlert(buildRecreateParams(alert))
              triggerSuccess()
              showToast({
                message: isThresholdAlert(alert)
                  ? t(
                      alert.direction === 'above'
                        ? 'alerts.createSuccessAbove'
                        : 'alerts.createSuccessBelow',
                      {
                        pair,
                        rate: formatAlertRate({
                          rate: alert.targetRate,
                          decimals,
                          locale: i18n.language,
                        }),
                      }
                    )
                  : t('alerts.createSuccessVariation', {
                      pair,
                      percent: alert.variationPercent,
                    }),
                type: 'success',
              })
              onSuccess?.()
            } catch (err) {
              showToast({
                message: err instanceof Error ? err.message : t('error.unknownError'),
                type: 'error',
              })
            }
          },
        },
      ],
      { cancelable: true }
    )
  }

  return { confirmDelete, confirmRecreate }
}
