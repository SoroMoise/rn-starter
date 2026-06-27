import { useToast } from '@/providers/ToastProvider'
import { useAlertsStore } from '@/stores/alertsStore'
import { cancelAlertNotification } from '@/services/notifications/scheduleAlert'
import { triggerMedium, triggerWarning } from '@/utils/haptics'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'

export function useAlertActions() {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const remove = useAlertsStore((s) => s.remove)

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
            triggerWarning()
            await cancelAlertNotification(alertId)
            remove(alertId)
            showToast({ message: t('alerts.deleteSuccess'), type: 'success' })
          },
        },
      ],
      { cancelable: true }
    )
  }

  return { confirmDelete }
}
