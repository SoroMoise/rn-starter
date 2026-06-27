import { AllAlertsBottomSheet } from '@/components/alerts/AllAlertsBottomSheet'
import { QuietHoursSheet } from '@/components/settings/QuietHoursSheet'
import {
  Divider,
  Section,
  SectionContent,
  SectionHeader,
} from '@/components/settings/SettingsSection'
import { DirectionalIcon } from '@/components/ui/DirectionalIcon'
import { ThemedText } from '@/components/ui/ThemedText'
import { ALERT_THEME } from '@/constants/alertTheme'
import { usePremium } from '@/hooks/usePremium'
import { analyticsService } from '@/services/api/analyticsService'
import { notificationService, recreateAlertsChannel } from '@/services/notifications'
import { useAlertsStore } from '@/stores/alertsStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { triggerLight } from '@/utils/haptics'
import Ionicons from '@expo/vector-icons/Ionicons'
import { getApp } from '@react-native-firebase/app'
import { AuthorizationStatus, getMessaging, hasPermission } from '@react-native-firebase/messaging'
import { KEYS } from '@services/storage/keys'
import { mmkv } from '@services/storage/mmkv'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppState, Linking, Switch, TouchableOpacity, View } from 'react-native'
import { useShallow } from 'zustand/shallow'

type PermissionState = 'unknown' | 'granted' | 'denied'

async function queryPermissionState(): Promise<PermissionState> {
  try {
    const status = await hasPermission(getMessaging(getApp()))
    const granted =
      status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL
    return granted ? 'granted' : 'denied'
  } catch {
    return 'unknown'
  }
}

function usePermissionState(active: boolean): PermissionState {
  const [state, setState] = useState<PermissionState>('unknown')

  const refresh = useCallback(() => {
    void queryPermissionState().then(setState)
  }, [])

  useEffect(() => {
    if (!active) return
    refresh()
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') refresh()
    })
    return () => sub.remove()
  }, [active, refresh])

  return state
}

export function AlertsSettingsSection() {
  const { t } = useTranslation()
  const { isPremium, openPaywall } = usePremium()
  const [sheetVisible, setSheetVisible] = useState(false)
  const [quietHoursSheetVisible, setQuietHoursSheetVisible] = useState(false)
  const [preferencesExpanded, setPreferencesExpanded] = useState(false)

  const activeCount = useAlertsStore((s) => s.alerts.filter((a) => a.isActive).length)
  const totalCount = useAlertsStore((s) => s.alerts.length)

  const { settings, updateSetting } = useSettingsStore(
    useShallow((s) => ({ settings: s.settings, updateSetting: s.updateSetting }))
  )

  const permission = usePermissionState(isPremium)

  const handlePress = useCallback(() => {
    triggerLight()
    setSheetVisible(true)
  }, [])

  const handleUnlock = useCallback(() => {
    setSheetVisible(false)
    void openPaywall({ source: 'alerts_settings_hub' })
  }, [openPaywall])

  const handleOpenSystemSettings = useCallback(() => {
    triggerLight()
    void Linking.openSettings()
  }, [])

  const handleRequestPermission = useCallback(() => {
    triggerLight()
    void notificationService.requestPermission()
  }, [])

  const handleMasterToggle = useCallback(
    (value: boolean) => {
      analyticsService.track('notif_pref_master_toggled', { enabled: value })
      updateSetting('notifications', value)
    },
    [updateSetting]
  )

  const handleQuietHoursEnabled = useCallback(
    (value: boolean) => {
      analyticsService.track('notif_pref_quiet_hours_toggled', { enabled: value })
      updateSetting('notificationQuietHoursEnabled', value)
    },
    [updateSetting]
  )

  const handleSoundToggle = useCallback(
    (value: boolean) => {
      analyticsService.track('notif_pref_sound_toggled', { enabled: value })
      updateSetting('notificationSound', value)
      void recreateAlertsChannel({
        sound: value,
        vibration: settings.notificationVibration,
      })
    },
    [updateSetting, settings.notificationVibration]
  )

  const handleVibrationToggle = useCallback(
    (value: boolean) => {
      analyticsService.track('notif_pref_vibration_toggled', { enabled: value })
      updateSetting('notificationVibration', value)
      void recreateAlertsChannel({
        sound: settings.notificationSound,
        vibration: value,
      })
    },
    [updateSetting, settings.notificationSound]
  )

  const handleSaveQuietHours = useCallback(
    ({ start, end }: { start: string; end: string }) => {
      analyticsService.track('notif_pref_quiet_hours_saved', { start, end })
      updateSetting('notificationQuietHoursStart', start)
      updateSetting('notificationQuietHoursEnd', end)
    },
    [updateSetting]
  )

  const subtitleKey = !isPremium
    ? t('alerts.allPreviewSubtitle')
    : totalCount === 0
      ? t('alerts.allEmptyTitle')
      : t('alerts.activeOfTotal', { active: activeCount, total: totalCount })

  const wasPermissionRequested = mmkv.getBoolean(KEYS.NOTIFICATION_PERMISSION_REQUESTED) === true

  const showPreferences = isPremium && permission === 'granted'
  const showHealthDenied = isPremium && permission === 'denied' && wasPermissionRequested
  const showPermissionInvite = isPremium && permission === 'denied' && !wasPermissionRequested
  const togglesDisabled = !settings.notifications

  return (
    <>
      <Section>
        <SectionHeader>{t('alerts.sectionHeader')}</SectionHeader>
        <SectionContent>
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={handlePress}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('alerts.allMyAlerts')}
              className="flex-1 flex-row items-center gap-3 py-3.5 pl-4">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30">
                <Ionicons
                  name={isPremium && activeCount > 0 ? 'notifications' : 'notifications-outline'}
                  size={18}
                  color={ALERT_THEME.primary}
                />
              </View>
              <View className="flex-1">
                <ThemedText variant="body" weight="medium">
                  {t('alerts.allMyAlerts')}
                </ThemedText>
                <ThemedText variant="caption" color="muted">
                  {subtitleKey}
                </ThemedText>
              </View>
              {!isPremium && (
                <View className="rounded-full bg-violet-100 px-2 py-0.5 dark:bg-violet-900/40">
                  <ThemedText
                    variant="caption"
                    weight="semibold"
                    color="inherit"
                    className="text-violet-700 dark:text-violet-300">
                    PRO
                  </ThemedText>
                </View>
              )}
            </TouchableOpacity>
            {showPreferences ? (
              <>
                <View className="my-2 w-px self-stretch bg-gray-100 dark:bg-gray-700" />
                <TouchableOpacity
                  onPress={() => {
                    triggerLight()
                    setPreferencesExpanded((v) => !v)
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: preferencesExpanded }}
                  accessibilityLabel={t('alerts.sectionHeader')}
                  hitSlop={8}
                  className="px-4 py-3.5">
                  <Ionicons
                    name={preferencesExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#9ca3af"
                  />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                onPress={handlePress}
                activeOpacity={0.7}
                accessibilityRole="button"
                className="py-3.5 pl-2 pr-4">
                <DirectionalIcon name="chevron-forward" size={16} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>

          {showPermissionInvite && (
            <>
              <Divider />
              <TouchableOpacity
                onPress={handleRequestPermission}
                activeOpacity={0.7}
                accessibilityRole="button"
                className="flex-row items-center gap-3 px-4 py-3.5">
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30">
                  <Ionicons name="notifications-outline" size={18} color={ALERT_THEME.primary} />
                </View>
                <View className="flex-1">
                  <ThemedText variant="body" weight="medium">
                    {t('alerts.preferences.enableInvite')}
                  </ThemedText>
                  <ThemedText variant="caption" color="muted">
                    {t('alerts.preferences.enableInviteDescription')}
                  </ThemedText>
                </View>
                <DirectionalIcon name="chevron-forward" size={16} color="#9ca3af" />
              </TouchableOpacity>
            </>
          )}

          {showHealthDenied && (
            <>
              <Divider />
              <TouchableOpacity
                onPress={handleOpenSystemSettings}
                activeOpacity={0.7}
                accessibilityRole="button"
                className="flex-row items-center gap-3 px-4 py-3.5">
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30">
                  <Ionicons
                    name="notifications-off-outline"
                    size={18}
                    color={ALERT_THEME.primary}
                  />
                </View>
                <View className="flex-1">
                  <ThemedText variant="body" weight="medium">
                    {t('alerts.preferences.healthDenied')}
                  </ThemedText>
                  <ThemedText variant="caption" color="muted">
                    {t('alerts.preferences.openSystemSettings')}
                  </ThemedText>
                </View>
                <DirectionalIcon name="chevron-forward" size={16} color="#9ca3af" />
              </TouchableOpacity>
            </>
          )}

          {showPreferences && preferencesExpanded && (
            <>
              <Divider />
              <View className="flex-row items-center gap-3 px-4 py-3">
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30">
                  <Ionicons name="notifications" size={18} color={ALERT_THEME.primary} />
                </View>
                <View className="flex-1">
                  <ThemedText variant="body" weight="medium">
                    {t('alerts.preferences.master')}
                  </ThemedText>
                  <ThemedText variant="caption" color="muted">
                    {t('alerts.preferences.masterDescription')}
                  </ThemedText>
                </View>
                <Switch
                  value={settings.notifications}
                  onValueChange={handleMasterToggle}
                  trackColor={{ false: '#e5e7eb', true: ALERT_THEME.primary }}
                  thumbColor="#ffffff"
                />
              </View>

              <Divider />
              <View
                style={{ opacity: togglesDisabled ? 0.5 : 1 }}
                pointerEvents={togglesDisabled ? 'none' : 'auto'}>
                <TouchableOpacity
                  onPress={() => {
                    triggerLight()
                    if (settings.notificationQuietHoursEnabled) {
                      setQuietHoursSheetVisible(true)
                    } else {
                      handleQuietHoursEnabled(true)
                    }
                  }}
                  activeOpacity={togglesDisabled ? 1 : 0.7}
                  accessibilityRole="button"
                  className="flex-row items-center gap-3 px-4 py-3">
                  <View className="h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
                    <Ionicons name="moon" size={18} color="#6366f1" />
                  </View>
                  <View className="flex-1">
                    <ThemedText variant="body" weight="medium">
                      {t('alerts.preferences.quietHours')}
                    </ThemedText>
                    <ThemedText variant="caption" color="muted">
                      {settings.notificationQuietHoursEnabled
                        ? t('alerts.preferences.quietHoursDescription', {
                            start: settings.notificationQuietHoursStart,
                            end: settings.notificationQuietHoursEnd,
                          })
                        : t('alerts.preferences.quietHoursOff')}
                    </ThemedText>
                  </View>
                  <Switch
                    value={settings.notificationQuietHoursEnabled}
                    onValueChange={handleQuietHoursEnabled}
                    trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
                    thumbColor="#ffffff"
                  />
                </TouchableOpacity>

                <Divider />
                <View className="flex-row items-center gap-3 px-4 py-3">
                  <View className="h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30">
                    <Ionicons name="volume-high" size={18} color="#3b82f6" />
                  </View>
                  <View className="flex-1">
                    <ThemedText variant="body" weight="medium">
                      {t('alerts.preferences.sound')}
                    </ThemedText>
                  </View>
                  <Switch
                    value={settings.notificationSound}
                    onValueChange={handleSoundToggle}
                    trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
                    thumbColor="#ffffff"
                  />
                </View>

                <Divider />
                <View className="flex-row items-center gap-3 px-4 py-3">
                  <View className="h-9 w-9 items-center justify-center rounded-xl bg-fuchsia-50 dark:bg-fuchsia-900/30">
                    <Ionicons name="phone-portrait" size={18} color="#d946ef" />
                  </View>
                  <View className="flex-1">
                    <ThemedText variant="body" weight="medium">
                      {t('alerts.preferences.vibration')}
                    </ThemedText>
                  </View>
                  <Switch
                    value={settings.notificationVibration}
                    onValueChange={handleVibrationToggle}
                    trackColor={{ false: '#e5e7eb', true: '#d946ef' }}
                    thumbColor="#ffffff"
                  />
                </View>
              </View>
            </>
          )}
        </SectionContent>
      </Section>

      <AllAlertsBottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        isPreview={!isPremium}
        onUnlockPress={handleUnlock}
      />

      <QuietHoursSheet
        visible={quietHoursSheetVisible}
        onClose={() => setQuietHoursSheetVisible(false)}
        initialStart={settings.notificationQuietHoursStart}
        initialEnd={settings.notificationQuietHoursEnd}
        onSave={handleSaveQuietHours}
      />
    </>
  )
}
