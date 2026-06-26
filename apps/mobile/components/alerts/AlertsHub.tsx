import { AlertPreviewLocked } from '@/components/alerts/AlertPreviewLocked'
import { AlertsOnboardingCard } from '@/components/alerts/AlertsOnboardingCard'
import { HubScrollView } from '@/components/alerts/HubScrollView'
import { PairGroupBlock } from '@/components/alerts/PairGroupBlock'
import { TriggeredAlertItem } from '@/components/alerts/TriggeredAlertItem'
import { GradientButton } from '@/components/ui/GradientButton'
import { SlidingSelector } from '@/components/ui/SlidingSelector'
import { ThemedText } from '@/components/ui/ThemedText'
import { ALERT_THEME } from '@/constants/alertTheme'
import { useAlertsOnboarding } from '@/hooks/useAlertsOnboarding'
import type { PairGroup } from '@/hooks/useAlertsHubData'
import type { RateAlert } from '@/types'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export type Tab = 'active' | 'history'

type Props = {
  isPreview: boolean
  isLoading: boolean
  alerts: RateAlert[]
  activeAlerts: RateAlert[]
  triggeredAlerts: RateAlert[]
  activeGroups: PairGroup[]
  tab: Tab
  onTabChange: (tab: Tab) => void
  onUnlockPress?: () => void
  onCreatePress: () => void
  onEditAlert: (alert: RateAlert) => void
  onDeleteAlert: (alertId: string) => void
  onRecreateAlert: (alert: RateAlert) => void
}

export function AlertsHub({
  isPreview,
  isLoading,
  alerts,
  activeAlerts,
  triggeredAlerts,
  activeGroups,
  tab,
  onTabChange,
  onUnlockPress,
  onCreatePress,
  onEditAlert,
  onDeleteAlert,
  onRecreateAlert,
}: Props) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { hasSeen: hasSeenOnboarding, markSeen: markOnboardingSeen } = useAlertsOnboarding()

  const tabOptions = useMemo(
    () => [
      {
        value: 'active' as const,
        label: `${t('alerts.tabActive')}${activeAlerts.length > 0 ? ` (${activeAlerts.length})` : ''}`,
      },
      {
        value: 'history' as const,
        label: `${t('alerts.tabHistory')}${triggeredAlerts.length > 0 ? ` (${triggeredAlerts.length})` : ''}`,
      },
    ],
    [t, activeAlerts.length, triggeredAlerts.length]
  )

  if (isPreview) {
    return (
      <HubScrollView>
        <AlertPreviewLocked onUnlockPress={onUnlockPress} />
      </HubScrollView>
    )
  }

  if (isLoading && alerts.length === 0) {
    return (
      <HubScrollView>
        <View className="gap-2 py-2">
          {[0, 1, 2].map((i) => (
            <View key={i} className="h-[72px] rounded-xl bg-gray-100 dark:bg-gray-700/50" />
          ))}
        </View>
      </HubScrollView>
    )
  }

  if (alerts.length === 0) {
    return (
      <HubScrollView>
        {!hasSeenOnboarding && <AlertsOnboardingCard onDismiss={markOnboardingSeen} />}
        <View className="items-center px-2 py-12">
          <View className="mb-5 h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
            <Ionicons name="notifications-outline" size={32} color="#9ca3af" />
          </View>
          <ThemedText variant="heading" weight="bold" align="center" className="mb-3">
            {t('alerts.allEmptyTitle')}
          </ThemedText>
          <ThemedText variant="body" color="muted" align="center" className="mb-8 leading-relaxed">
            {t('alerts.allEmptyHint')}
          </ThemedText>
          <GradientButton
            onPress={onCreatePress}
            colors={ALERT_THEME.gradient}
            style={{ width: '100%', borderRadius: 14 }}>
            <Ionicons name="add-circle" size={16} color="white" />
            <ThemedText variant="button" color="inverse">
              {t('alerts.create')}
            </ThemedText>
          </GradientButton>
        </View>
      </HubScrollView>
    )
  }

  return (
    <View className="flex-1">
      <HubScrollView>
        {!hasSeenOnboarding && <AlertsOnboardingCard onDismiss={markOnboardingSeen} />}

        <View className="mb-4">
          <SlidingSelector options={tabOptions} value={tab} onChange={onTabChange} variant="blue" />
        </View>

        {tab === 'active' ? (
          activeGroups.length === 0 ? (
            <View className="items-center py-10">
              <Ionicons name="notifications-outline" size={36} color="#9ca3af" />
              <ThemedText color="muted" align="center" className="mt-3">
                {t('alerts.noActiveAlerts')}
              </ThemedText>
            </View>
          ) : (
            activeGroups.map((group) => (
              <PairGroupBlock
                key={`${group.from}-${group.to}`}
                group={group}
                onDelete={onDeleteAlert}
                onEdit={onEditAlert}
              />
            ))
          )
        ) : triggeredAlerts.length === 0 ? (
          <View className="items-center py-10">
            <Ionicons name="archive-outline" size={36} color="#9ca3af" />
            <ThemedText color="muted" align="center" className="mt-3">
              {t('alerts.noHistoryAlerts')}
            </ThemedText>
          </View>
        ) : (
          triggeredAlerts.map((alert) => (
            <TriggeredAlertItem
              key={alert.id}
              alert={alert}
              onRecreate={() => onRecreateAlert(alert)}
              onDelete={() => onDeleteAlert(alert.id)}
            />
          ))
        )}
        <View style={{ height: 88 }} />
      </HubScrollView>

      <GradientButton
        onPress={onCreatePress}
        colors={ALERT_THEME.gradient}
        accessibilityLabel={t('alerts.create')}
        style={{
          position: 'absolute',
          right: 40,
          bottom: insets.bottom + 50,
          borderRadius: 32,
          shadowColor: '#4F4F4F',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 6,
        }}
        gradientStyle={{ width: 60, height: 60, paddingVertical: 0 }}>
        <Ionicons name="add" size={30} color="white" />
      </GradientButton>
    </View>
  )
}
