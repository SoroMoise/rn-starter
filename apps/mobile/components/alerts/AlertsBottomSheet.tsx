import { DirectionalIcon } from '@/components/ui/DirectionalIcon'
import { GradientButton } from '@/components/ui/GradientButton'
import {
  ModalBottomSheet,
  type ModalBottomSheetRef,
  ModalBottomSheetScrollView,
} from '@/components/ui/ModalBottomSheet'
import { ThemedText } from '@/components/ui/ThemedText'
import { ALERT_THEME } from '@/constants/alertTheme'
import { useAlertActions } from '@/hooks/useAlertActions'
import { useAlertsOnboarding } from '@/hooks/useAlertsOnboarding'
import { notificationService } from '@/services/notifications'
import { KEYS } from '@/services/storage/keys'
import { mmkv } from '@/services/storage/mmkv'
import { useAlertsStore } from '@/stores/alertsStore'
import type { RateAlert } from '@/types'
import { triggerLight } from '@/utils/haptics'
import Ionicons from '@expo/vector-icons/Ionicons'
import { getApp } from '@react-native-firebase/app'
import {
  AuthorizationStatus,
  hasPermission as fcmHasPermission,
  getMessaging,
} from '@react-native-firebase/messaging'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, Pressable, View } from 'react-native'
import { useShallow } from 'zustand/shallow'
import { AlertFormScreen } from './AlertFormScreen'
import { AlertListItem } from './AlertListItem'
import { AlertPreviewLocked } from './AlertPreviewLocked'
import { AlertsOnboardingCard } from './AlertsOnboardingCard'
import { PermissionView } from './PermissionView'

type Props = {
  visible: boolean
  onClose: () => void
  fromCurrency: string
  toCurrency: string
  isPreview?: boolean
  onUnlockPress?: () => void
  onSeeAllPress?: () => void
}

function AlertsScrollView({ children }: { children: React.ReactNode }) {
  return (
    <ModalBottomSheetScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}>
      {children}
    </ModalBottomSheetScrollView>
  )
}

export function AlertsBottomSheet({
  visible,
  onClose,
  fromCurrency,
  toCurrency,
  isPreview = false,
  onUnlockPress,
  onSeeAllPress,
}: Props) {
  const { t } = useTranslation()
  const { confirmDelete } = useAlertActions()
  const [view, setView] = useState<'list' | 'create' | 'permission'>('list')
  const [editingAlert, setEditingAlert] = useState<RateAlert | null>(null)
  const [hasPermission, setHasPermission] = useState(true)
  const sheetRef = useRef<ModalBottomSheetRef>(null)
  const seeAllPendingRef = useRef(false)

  const alerts = useAlertsStore(
    useShallow((s) =>
      s.alerts.filter((a) => a.fromCurrency === fromCurrency && a.toCurrency === toCurrency)
    )
  )
  const fetchAlerts = useAlertsStore((s) => s.fetchAlerts)
  const isLoading = useAlertsStore((s) => s.isLoading)
  const error = useAlertsStore((s) => s.error)
  const { hasSeen: hasSeenOnboarding, markSeen: markOnboardingSeen } = useAlertsOnboarding()

  useEffect(() => {
    if (!visible) return
    setView('list')
    setEditingAlert(null)
    if (isPreview) return
    void fetchAlerts()
    fcmHasPermission(getMessaging(getApp())).then((status) => {
      const isGranted =
        status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL
      const wasRequested = mmkv.getBoolean(KEYS.NOTIFICATION_PERMISSION_REQUESTED) ?? false
      setHasPermission(isGranted || !wasRequested)
    })
  }, [visible, fetchAlerts, isPreview])

  const handleCreatePress = async () => {
    triggerLight()
    setEditingAlert(null)
    sheetRef.current?.snapToFull?.()
    const needsPrimer = await notificationService.shouldShowPermissionPrimer()
    setView(needsPrimer ? 'permission' : 'create')
  }

  const handleEdit = (alert: RateAlert) => {
    triggerLight()
    setEditingAlert(alert)
    sheetRef.current?.snapToFull?.()
    setView('create')
  }

  const handleSheetClose = () => {
    onClose()
    if (seeAllPendingRef.current) {
      seeAllPendingRef.current = false
      onSeeAllPress?.()
    }
  }

  const handleSeeAllPress = () => {
    if (!onSeeAllPress) return
    triggerLight()
    seeAllPendingRef.current = true
    sheetRef.current?.close()
  }

  return (
    <ModalBottomSheet
      ref={sheetRef}
      initialSnap={0.55}
      visible={visible}
      onClose={handleSheetClose}
      onHardwareBack={() => {
        if (view === 'create' || view === 'permission') {
          setEditingAlert(null)
          setView('list')
          return true
        }
        return false
      }}
      title={t('alerts.title')}
      subtitle={`${fromCurrency} → ${toCurrency}`}>
      {isPreview ? (
        <AlertsScrollView>
          <AlertPreviewLocked onUnlockPress={onUnlockPress} />
        </AlertsScrollView>
      ) : view === 'list' ? (
        <AlertsScrollView>
          {!hasSeenOnboarding && <AlertsOnboardingCard onDismiss={markOnboardingSeen} />}

          {!hasPermission && (
            <Pressable
              onPress={() => void Linking.openSettings()}
              className="mb-4 flex-row items-start gap-3 rounded-xl bg-orange-50 p-4 dark:bg-orange-900/20">
              <Ionicons name="notifications-off" size={20} color="#ea580c" />
              <View className="flex-1 gap-1">
                <ThemedText variant="label" color="warning">
                  {t('alerts.notificationsDisabled')}
                </ThemedText>
                <ThemedText variant="caption" color="muted">
                  {t('alerts.notificationsDisabledHint')}
                </ThemedText>
                <View className="mt-2 flex-row items-center gap-1 self-start rounded-lg bg-orange-500 px-3 py-1.5">
                  <ThemedText variant="caption" color="inverse" weight="semibold">
                    {t('alerts.openSettings')}
                  </ThemedText>
                  <Ionicons name="open-outline" size={11} color="white" />
                </View>
              </View>
            </Pressable>
          )}

          {isLoading && alerts.length === 0 ? (
            <View className="gap-2 py-2">
              {[0, 1].map((i) => (
                <View key={i} className="h-[68px] rounded-xl bg-gray-100 dark:bg-gray-700/50" />
              ))}
            </View>
          ) : error && alerts.length === 0 ? (
            <View className="items-center py-12">
              <Ionicons name="cloud-offline-outline" size={40} color="#9ca3af" />
              <ThemedText color="muted" align="center" className="mt-3">
                {error ?? t('error.unknownError')}
              </ThemedText>
              <Pressable
                onPress={() => void fetchAlerts()}
                className="mt-4 rounded-lg bg-blue-50 px-4 py-2 dark:bg-blue-900/20">
                <ThemedText variant="label" color="primary">
                  {t('common.retry')}
                </ThemedText>
              </Pressable>
            </View>
          ) : alerts.length === 0 ? (
            <View className="items-center py-12">
              <Ionicons name="notifications-outline" size={40} color="#9ca3af" />
              <ThemedText color="muted" align="center" className="mt-3">
                {t('alerts.empty')}
              </ThemedText>
            </View>
          ) : (
            alerts.map((alert) => (
              <AlertListItem
                key={alert.id}
                alert={alert}
                onDelete={() => confirmDelete(alert.id)}
                onEdit={() => handleEdit(alert)}
              />
            ))
          )}

          <GradientButton
            onPress={() => void handleCreatePress()}
            colors={ALERT_THEME.gradient}
            style={{ marginTop: 16, borderRadius: 14 }}>
            <Ionicons name="add-circle" size={16} color="white" />
            <ThemedText variant="button" color="inverse">
              {t('alerts.create')}
            </ThemedText>
          </GradientButton>

          {onSeeAllPress && (
            <Pressable
              onPress={handleSeeAllPress}
              accessibilityRole="button"
              className="mt-3 flex-row items-center justify-center gap-1 py-2">
              <ThemedText
                variant="label"
                color="inherit"
                className="text-amber-600 dark:text-amber-400">
                {t('alerts.seeAllMyAlerts')}
              </ThemedText>
              <DirectionalIcon name="chevron-forward" size={14} color={ALERT_THEME.primary} />
            </Pressable>
          )}
        </AlertsScrollView>
      ) : view === 'permission' ? (
        <PermissionView
          fromCurrency={fromCurrency}
          toCurrency={toCurrency}
          onGranted={() => {
            setHasPermission(true)
            setView('create')
          }}
          onSkipped={() => setView('create')}
          onDenied={() => {
            setHasPermission(false)
            setView('list')
          }}
        />
      ) : (
        <AlertFormScreen
          formKey={editingAlert?.id ?? 'create'}
          fromCurrency={fromCurrency}
          toCurrency={toCurrency}
          editingAlert={editingAlert ?? undefined}
          onBack={() => {
            setEditingAlert(null)
            setView('list')
          }}
          onSuccess={() => {
            setEditingAlert(null)
            setView('list')
          }}
        />
      )}
    </ModalBottomSheet>
  )
}
