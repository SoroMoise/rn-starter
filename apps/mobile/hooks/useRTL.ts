import { useSettingsStore } from '@/stores/settingsStore'
import { isRTLLanguage } from '@/utils/rtl'

export function useRTL() {
  const language = useSettingsStore((s) => s.settings.language)
  return { isRTL: isRTLLanguage(language) }
}
