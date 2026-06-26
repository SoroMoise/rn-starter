import { useThemeColor } from '@/components/Themed'
import { BackupBootstrap } from '@/components/layout/BackupBootstrap'
import { MigrationLoadingScreen } from '@/components/layout/MigrationLoadingScreen'
import { TelemetryEffects } from '@/components/layout/TelemetryEffects'
import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen'
import { InitialLoadErrorModal } from '@/components/ui/InitialLoadErrorModal'
import { InitialLoadingScreen } from '@/components/ui/InitialLoadingScreen'
import { PremiumTabBar } from '@/components/ui/PremiumTabBar'
import { RTLRestartBanner } from '@/components/ui/RTLRestartBanner'
import { WidgetSettingsSheet } from '@/components/widget/WidgetSettingsSheet'
import { usePremium } from '@/hooks/usePremium'
import '@/i18n/service'
import { AdFreeProvider, useAdFree } from '@/providers/AdFreeProvider'
import {
  AlertNotificationProvider,
  useAlertNotification,
} from '@/providers/AlertNotificationProvider'
import { QueryProvider } from '@/providers/QueryProvider'
import { SubscriptionProvider } from '@/providers/SubscriptionProvider'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { ToastProvider } from '@/providers/ToastProvider'
import { AdService } from '@/services/api/adService'
import { analyticsService } from '@/services/api/analyticsService'
import { contextualPaywallService } from '@/services/api/contextualPaywall'
import { crashlyticsService } from '@/services/api/crashlyticsService'
import { engagementService } from '@/services/api/engagementService'
import { purchaseService } from '@/services/api/purchaseService'
import { ensureNotificationChannels, notificationService } from '@/services/notifications'
import { mmkv } from '@/services/storage'
import { KEYS } from '@/services/storage/keys'
import { runStorageMigration } from '@/services/storage/migration'
import { useAlertsStore } from '@/stores/alertsStore'
import { useCurrencyStore } from '@/stores/currencyStore'
import { useExportPreferencesStore } from '@/stores/exportPreferencesStore'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { useQuickConversionsStore } from '@/stores/quickConversionsStore'
import { useSettingsStore } from '@/stores/settingsStore'
import Constants from 'expo-constants'
import { Tabs } from 'expo-router'
import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import '../global.css'

function TabLayout() {
  const colors = useThemeColor()

  return (
    <Tabs
      tabBar={(props) => <PremiumTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.screenBackground },
      }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="statistics" options={{ lazy: true }} />
      <Tabs.Screen name="settings" options={{ lazy: true }} />
    </Tabs>
  )
}

function AppContent() {
  const { isAdFreeActive } = useAdFree()
  const { isPremium, isInitialized: isSubscriptionInitialized } = usePremium()
  const language = useSettingsStore((s) => s.settings.language)
  const theme = useSettingsStore((s) => s.settings.theme)
  const quickCurrencies = useQuickConversionsStore((s) => s.quickCurrencies)
  const sourceCurrency = useSettingsStore((s) => s.settings.defaultCurrencyFrom)

  const isOnboardingCompleted = useOnboardingStore((s) => s.isCompleted)
  const isInitializing = useCurrencyStore((s) => s.isInitializing)
  const initializationError = useCurrencyStore((s) => s.initializationError)
  const initializeOfflineData = useCurrencyStore((s) => s.initializeOfflineData)
  const retryInitialization = useCurrencyStore((s) => s.retryInitialization)

  useEffect(() => {
    if (!isSubscriptionInitialized) return
    const run = async () => {
      const appVersion = Constants.expoConfig?.version ?? 'unknown'
      const [sessionCtx] = await Promise.all([
        engagementService.initSession(),
        analyticsService.init({ isPremium, platform: Platform.OS, appVersion }),
      ])
      contextualPaywallService.resetSession()
      await Promise.all([
        analyticsService.setUserProperty('preferred_language', language),
        analyticsService.setUserProperty('currency_count', String(quickCurrencies.length)),
        analyticsService.setUserProperty('source_currency', sourceCurrency),
        analyticsService.setUserProperty('session_count', String(sessionCtx.sessionCount)),
        analyticsService.setUserProperty('days_since_install', String(sessionCtx.daysSinceInstall)),
      ])
      analyticsService.track('app_session_started', {
        language,
        theme,
        currencies_count: quickCurrencies.length,
        is_ad_free_active: isAdFreeActive,
        is_premium: isPremium,
        platform: Platform.OS,
        app_version: appVersion,
        source_currency: sourceCurrency,
        target_currencies: quickCurrencies.join(',').slice(0, 100),
        session_count: sessionCtx.sessionCount,
        days_since_install: sessionCtx.daysSinceInstall,
      })
    }
    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubscriptionInitialized]) // intentional: snapshot de l'état au démarrage de la session

  useEffect(() => {
    if (isOnboardingCompleted) {
      AdService.initialize()
      initializeOfflineData()
    }
  }, [isOnboardingCompleted, initializeOfflineData])

  useEffect(() => {
    if (initializationError) {
      analyticsService.logAppInitializationFailed(initializationError.message)
    }
  }, [initializationError])

  const fetchAlerts = useAlertsStore((s) => s.fetchAlerts)
  const { showAlertNotification, tapAlertDeepLink } = useAlertNotification()

  useEffect(() => {
    if (!isOnboardingCompleted || !isPremium || !isSubscriptionInitialized) return

    void fetchAlerts()
    void ensureNotificationChannels()

    purchaseService
      .getCustomerInfo()
      .then((info) => {
        notificationService.setup({
          rcCustomerId: info.originalAppUserId,
          onForegroundAlert: (data) => {
            showAlertNotification(data)
            void fetchAlerts()
          },
          onTapAlert: (data) => {
            tapAlertDeepLink(data)
            void fetchAlerts()
          },
        })
      })
      .catch(() => {})
  }, [isOnboardingCompleted, isPremium, isSubscriptionInitialized]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOnboardingCompleted) return <OnboardingScreen />

  if (isInitializing) return <InitialLoadingScreen />

  return (
    <>
      <TabLayout />

      <WidgetSettingsSheet />

      <InitialLoadErrorModal
        visible={!!initializationError}
        onRetry={() => {
          analyticsService.track('app_init_retried')
          retryInitialization()
        }}
        isRetrying={isInitializing}
      />
    </>
  )
}

function RootLayoutContent() {
  const colors = useThemeColor()
  const [isMigrationDone, setMigrationDone] = useState(false)

  useEffect(() => {
    // Zustand persist with MMKV hydrates synchronously at module import, before this effect
    // runs. If MMKV is empty (first boot after migration), stores initialize with defaults.
    // After migration writes the data, we must force rehydration so stores pick it up.
    const needsRehydration = mmkv.getBoolean(KEYS.MIGRATION_DONE) !== true

    runStorageMigration()
      .then(() => {
        if (needsRehydration) {
          useOnboardingStore.persist.rehydrate()
          useSettingsStore.persist.rehydrate()
          useQuickConversionsStore.persist.rehydrate()
          useExportPreferencesStore.persist.rehydrate()
        }
      })
      .catch((err) => {
        crashlyticsService.recordError(
          err instanceof Error ? err : new Error('Storage migration failed'),
          { source: '_layout.runStorageMigration' }
        )
      })
      .finally(() => setMigrationDone(true))
  }, [])

  if (!isMigrationDone) {
    return <MigrationLoadingScreen />
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.screenBackground }}>
      <TelemetryEffects />
      <BackupBootstrap />
      <QueryProvider>
        <ThemeProvider>
          <ToastProvider>
            <SubscriptionProvider>
              <AdFreeProvider>
                <AlertNotificationProvider>
                  <AppContent />
                </AlertNotificationProvider>
              </AdFreeProvider>
            </SubscriptionProvider>
          </ToastProvider>
        </ThemeProvider>
      </QueryProvider>
      <RTLRestartBanner />
    </GestureHandlerRootView>
  )
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <RootLayoutContent />
    </SafeAreaProvider>
  )
}
