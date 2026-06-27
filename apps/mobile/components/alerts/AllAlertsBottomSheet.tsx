import { AlertFormScreen } from '@/components/alerts/AlertFormScreen'
import { AlertsHub, type Tab } from '@/components/alerts/AlertsHub'
import { PermissionView } from '@/components/alerts/PermissionView'
import { ModalBottomSheet, type ModalBottomSheetRef } from '@/components/ui/ModalBottomSheet'
import { useAlertActions } from '@/hooks/useAlertActions'
import { useAlertsHubData } from '@/hooks/useAlertsHubData'
import { notificationService } from '@/services/notifications'
import { useAlertsStore } from '@/stores/alertsStore'
import type { ScheduledAlert } from '@/stores/alertsStore'
import { triggerLight } from '@/utils/haptics'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

type Props = {
  visible: boolean
  onClose: () => void
  isPreview?: boolean
  onUnlockPress?: () => void
}

type Screen =
  | { kind: 'hub' }
  | { kind: 'create'; step: 'permission' | 'form' }
  | { kind: 'edit'; alert: ScheduledAlert }

export function AllAlertsBottomSheet({
  visible,
  onClose,
  isPreview = false,
  onUnlockPress,
}: Props) {
  const { t } = useTranslation()
  const alerts = useAlertsStore((s) => s.alerts)
  const { activeAlerts, triggeredAlerts } = useAlertsHubData()
  const { confirmDelete } = useAlertActions()

  const [screen, setScreen] = useState<Screen>({ kind: 'hub' })
  const [tab, setTab] = useState<Tab>('active')
  const sheetRef = useRef<ModalBottomSheetRef>(null)

  useEffect(() => {
    if (!visible) return
    setScreen({ kind: 'hub' })
    setTab('active')
  }, [visible])

  const handleStartCreate = async () => {
    triggerLight()
    setScreen({ kind: 'create', step: 'form' })
    sheetRef.current?.snapToFull?.()
    const needsPrimer = await notificationService.shouldShowPermissionPrimer()
    setScreen({ kind: 'create', step: needsPrimer ? 'permission' : 'form' })
  }

  const handleEdit = (alert: ScheduledAlert) => {
    triggerLight()
    setScreen({ kind: 'edit', alert })
    sheetRef.current?.snapToFull?.()
  }

  const hubSubtitle =
    isPreview || alerts.length === 0
      ? undefined
      : t('alerts.activeOfTotal', { active: activeAlerts.length, total: alerts.length })

  const title =
    screen.kind === 'edit'
      ? t('alerts.editAlert')
      : screen.kind === 'create'
        ? t('alerts.newAlert')
        : t('alerts.allMyAlerts')

  const subtitle = screen.kind === 'hub' ? hubSubtitle : undefined

  return (
    <ModalBottomSheet
      ref={sheetRef}
      visible={visible}
      onClose={onClose}
      onHardwareBack={() => {
        if (screen.kind !== 'hub') {
          setScreen({ kind: 'hub' })
          return true
        }
        return false
      }}
      title={title}
      subtitle={subtitle}>
      {screen.kind === 'edit' ? (
        <AlertFormScreen
          formKey={screen.alert.id}
          editingAlert={screen.alert}
          onBack={() => setScreen({ kind: 'hub' })}
          onSuccess={() => setScreen({ kind: 'hub' })}
        />
      ) : screen.kind === 'create' ? (
        screen.step === 'permission' ? (
          <PermissionView
            onGranted={() => setScreen({ kind: 'create', step: 'form' })}
            onSkipped={() => setScreen({ kind: 'create', step: 'form' })}
            onDenied={() => setScreen({ kind: 'create', step: 'form' })}
          />
        ) : (
          <AlertFormScreen
            onBack={() => setScreen({ kind: 'hub' })}
            onSuccess={() => {
              setScreen({ kind: 'hub' })
              setTab('active')
            }}
          />
        )
      ) : (
        <AlertsHub
          isPreview={isPreview}
          isLoading={false}
          alerts={alerts}
          activeAlerts={activeAlerts}
          triggeredAlerts={triggeredAlerts}
          tab={tab}
          onTabChange={setTab}
          onUnlockPress={onUnlockPress}
          onCreatePress={() => void handleStartCreate()}
          onEditAlert={handleEdit}
          onDeleteAlert={confirmDelete}
        />
      )}
    </ModalBottomSheet>
  )
}
