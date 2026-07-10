import { useThemeColor } from '@/components/Themed'
import { TelemetryEffects } from '@/components/layout/TelemetryEffects'
import { OnboardingScreen } from '@/components/onboarding/OnboardingScreen'
import { PremiumTabBar } from '@/components/ui/PremiumTabBar'
import { RTLRestartBanner } from '@/components/ui/RTLRestartBanner'
import { usePremium } from '@/hooks/usePremium'
import '@/i18n/service'
import { AdFreeProvider, useAdFree } from '@/providers/AdFreeProvider'
import { QueryProvider } from '@/providers/QueryProvider'
import { SubscriptionProvider } from '@/providers/SubscriptionProvider'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { ToastProvider } from '@/providers/ToastProvider'
import { AdService } from '@/services/api/adService'
import { analyticsService } from '@/services/api/analyticsService'
import { contextualPaywallService } from '@/services/api/contextualPaywall'
import { engagementService } from '@/services/api/engagementService'
import { ensureNotificationChannels } from '@/services/notifications'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { useSettingsStore } from '@/stores/settingsStore'
import Constants from 'expo-constants'
import { Tabs } from 'expo-router'
import { useEffect } from 'react'
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
      <Tabs.Screen name="settings" options={{ lazy: true }} />
    </Tabs>
  )
}

function AppContent() {
  const { isAdFreeActive } = useAdFree()
  const { isPremium, isInitialized: isSubscriptionInitialized } = usePremium()
  const language = useSettingsStore((s) => s.settings.language)
  const theme = useSettingsStore((s) => s.settings.theme)

  const isOnboardingCompleted = useOnboardingStore((s) => s.isCompleted)

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
        analyticsService.setUserProperty('session_count', String(sessionCtx.sessionCount)),
        analyticsService.setUserProperty('days_since_install', String(sessionCtx.daysSinceInstall)),
      ])
      analyticsService.track('app_session_started', {
        language,
        theme,
        is_ad_free_active: isAdFreeActive,
        is_premium: isPremium,
        platform: Platform.OS,
        app_version: appVersion,
        session_count: sessionCtx.sessionCount,
        days_since_install: sessionCtx.daysSinceInstall,
      })
    }
    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubscriptionInitialized]) // intentional: snapshot at session start

  useEffect(() => {
    if (isOnboardingCompleted) {
      AdService.initialize()
    }
  }, [isOnboardingCompleted])

  useEffect(() => {
    if (!isOnboardingCompleted) return
    void ensureNotificationChannels()
  }, [isOnboardingCompleted])

  if (!isOnboardingCompleted) return <OnboardingScreen />

  return <TabLayout />
}

function RootLayoutContent() {
  const colors = useThemeColor()

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.screenBackground }}>
      <TelemetryEffects />
      <QueryProvider>
        <ThemeProvider>
          <ToastProvider>
            <SubscriptionProvider>
              <AdFreeProvider>
                <AppContent />
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
