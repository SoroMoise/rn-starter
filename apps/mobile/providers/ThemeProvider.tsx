import { AppSystemBars } from '@/components/AppSystemBars'
import { useSettingsStore } from '@/stores/settingsStore'
import { applyColorScheme } from '@utils/colorScheme'
import { useEffect, type PropsWithChildren } from 'react'

export function ThemeProvider({ children }: PropsWithChildren) {
  const themeMode = useSettingsStore((s) => s.settings.theme)

  useEffect(() => {
    applyColorScheme(themeMode)
  }, [themeMode])

  return (
    <>
      <AppSystemBars />
      {children}
    </>
  )
}
