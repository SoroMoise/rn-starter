import { analyticsService } from '@/services/api/analyticsService'
import { crashlyticsService } from '@/services/api/crashlyticsService'
import { useQuickConversionsStore } from '@/stores/quickConversionsStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { usePathname } from 'expo-router'
import { useEffect } from 'react'

export function TelemetryEffects() {
  const pathname = usePathname()
  const language = useSettingsStore((s) => s.settings.language)
  const theme = useSettingsStore((s) => s.settings.theme)
  const quickCurrenciesCount = useQuickConversionsStore((s) => s.quickCurrencies.length)

  useEffect(() => {
    analyticsService.logScreenView(pathname === '/' ? '/conversions' : pathname)
  }, [pathname])

  useEffect(() => {
    crashlyticsService.setUserAttributes({
      language,
      theme,
      currenciesCount: quickCurrenciesCount,
    })
  }, [language, theme, quickCurrenciesCount])

  return null
}
