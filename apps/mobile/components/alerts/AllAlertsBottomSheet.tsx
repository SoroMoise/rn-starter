import { AlertFormScreen } from '@/components/alerts/AlertFormScreen'
import { AlertsHub, type Tab } from '@/components/alerts/AlertsHub'
import { PermissionView } from '@/components/alerts/PermissionView'
import { CurrencyPicker } from '@/components/currency/CurrencyPicker'
import { ModalBottomSheet, type ModalBottomSheetRef } from '@/components/ui/ModalBottomSheet'
import { getCurrencyByCode } from '@/constants/currencies'
import { useAlertActions } from '@/hooks/useAlertActions'
import { useAlertsHubData } from '@/hooks/useAlertsHubData'
import { notificationService } from '@/services/notifications'
import { useAlertsStore } from '@/stores/alertsStore'
import { useSettingsStore } from '@/stores/settingsStore'
import type { Currency, RateAlert } from '@/types'
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
  | { kind: 'edit'; alert: RateAlert }

export function AllAlertsBottomSheet({
  visible,
  onClose,
  isPreview = false,
  onUnlockPress,
}: Props) {
  const { t } = useTranslation()
  const fetchAlerts = useAlertsStore((s) => s.fetchAlerts)
  const isLoading = useAlertsStore((s) => s.isLoading)
  const { alerts, activeAlerts, triggeredAlerts, activeGroups } = useAlertsHubData()
  const { confirmDelete, confirmRecreate } = useAlertActions()

  const [screen, setScreen] = useState<Screen>({ kind: 'hub' })
  const [tab, setTab] = useState<Tab>('active')
  const [draftFrom, setDraftFrom] = useState('')
  const [draftTo, setDraftTo] = useState('')
  const [pickerSide, setPickerSide] = useState<'from' | 'to' | null>(null)
  const sheetRef = useRef<ModalBottomSheetRef>(null)

  useEffect(() => {
    if (!visible || isPreview) return
    void fetchAlerts()
  }, [visible, fetchAlerts, isPreview])

  useEffect(() => {
    if (!visible) return
    setScreen({ kind: 'hub' })
    setTab('active')
    setPickerSide(null)
  }, [visible])

  const handleStartCreate = async () => {
    triggerLight()
    const { defaultCurrencyFrom, defaultCurrencyTo } = useSettingsStore.getState().settings
    setDraftFrom(defaultCurrencyFrom)
    setDraftTo(defaultCurrencyTo)
    setScreen({ kind: 'create', step: 'form' })
    sheetRef.current?.snapToFull?.()
    const needsPrimer = await notificationService.shouldShowPermissionPrimer()
    setScreen({ kind: 'create', step: needsPrimer ? 'permission' : 'form' })
  }

  const handleEdit = (alert: RateAlert) => {
    triggerLight()
    setScreen({ kind: 'edit', alert })
    sheetRef.current?.snapToFull?.()
  }

  const handleCreateSwap = () => {
    setDraftFrom(draftTo)
    setDraftTo(draftFrom)
  }

  const handleCreateCurrencySelect = (currency: Currency) => {
    if (pickerSide === 'from') {
      setDraftFrom(currency.code === draftTo ? draftFrom : currency.code)
    } else if (pickerSide === 'to') {
      setDraftTo(currency.code === draftFrom ? draftTo : currency.code)
    }
    setPickerSide(null)
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

  const subtitle =
    screen.kind === 'edit'
      ? `${getCurrencyByCode(screen.alert.fromCurrency).flag} ${screen.alert.fromCurrency} → ${getCurrencyByCode(screen.alert.toCurrency).flag} ${screen.alert.toCurrency}`
      : screen.kind === 'create'
        ? undefined
        : hubSubtitle

  return (
    <>
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
            fromCurrency={screen.alert.fromCurrency}
            toCurrency={screen.alert.toCurrency}
            editingAlert={screen.alert}
            onBack={() => setScreen({ kind: 'hub' })}
            onSuccess={() => setScreen({ kind: 'hub' })}
          />
        ) : screen.kind === 'create' ? (
          screen.step === 'permission' ? (
            <PermissionView
              fromCurrency={draftFrom}
              toCurrency={draftTo}
              onGranted={() => setScreen({ kind: 'create', step: 'form' })}
              onSkipped={() => setScreen({ kind: 'create', step: 'form' })}
              onDenied={() => setScreen({ kind: 'create', step: 'form' })}
            />
          ) : (
            <AlertFormScreen
              fromCurrency={draftFrom}
              toCurrency={draftTo}
              editablePair
              onFromPress={() => setPickerSide('from')}
              onToPress={() => setPickerSide('to')}
              onSwap={handleCreateSwap}
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
            isLoading={isLoading}
            alerts={alerts}
            activeAlerts={activeAlerts}
            triggeredAlerts={triggeredAlerts}
            activeGroups={activeGroups}
            tab={tab}
            onTabChange={setTab}
            onUnlockPress={onUnlockPress}
            onCreatePress={() => void handleStartCreate()}
            onEditAlert={handleEdit}
            onDeleteAlert={confirmDelete}
            onRecreateAlert={(alert) =>
              confirmRecreate({ alert, onSuccess: () => setTab('active') })
            }
          />
        )}
      </ModalBottomSheet>

      <CurrencyPicker
        visible={pickerSide !== null}
        onClose={() => setPickerSide(null)}
        onSelect={handleCreateCurrencySelect}
        selectedCode={pickerSide === 'from' ? draftFrom : draftTo}
      />
    </>
  )
}
