import { analyticsService } from '@/services/api/analyticsService'
import { crashlyticsService } from '@/services/api/crashlyticsService'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { usePathname, useSegments } from 'expo-router'
import { useEffect } from 'react'

// The route pattern, never the pathname: a dynamic segment's value (`/reading/<id>`, a kind or a
// name in the URL) would reach Analytics and Crashlytics, where an id floods the reports and a
// value can reveal what Google Analytics forbids collecting.
function screenName(segments: readonly string[]): string {
  const path = segments.filter((segment) => !segment.startsWith('(')).join('/')
  return path === '' ? '/home' : `/${path}`
}

export function TelemetryEffects() {
  const segments = useSegments()
  const pathname = usePathname()
  const isOnboardingCompleted = useOnboardingStore((s) => s.isCompleted)
  const screen = isOnboardingCompleted ? screenName(segments) : '/onboarding'
  const language = useSettingsStore((s) => s.settings.language)
  const theme = useSettingsStore((s) => s.settings.theme)

  useEffect(() => {
    analyticsService.logScreenView(screen)
  }, [screen, pathname])

  useEffect(() => {
    crashlyticsService.setUserAttributes({
      language,
      theme,
    })
  }, [language, theme])

  return null
}
