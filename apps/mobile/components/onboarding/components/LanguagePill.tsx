import { ThemedText } from '@/components/ui/ThemedText'
import { useSettingsStore } from '@/stores/settingsStore'
import { getLanguageByCode } from '@constants/languages'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useThemedColor } from '@hooks/useThemedColor'
import { useTranslation } from 'react-i18next'
import { Pressable } from 'react-native'

export function LanguagePill({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation()
  const isDark = useThemedColor()
  const language = useSettingsStore((s) => s.settings.language)
  const activeLanguage = getLanguageByCode(language)

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-2 rounded-full bg-black/[0.05] px-3 py-2 dark:bg-white/10"
      accessibilityRole="button"
      accessibilityLabel={t('settings.selectLanguage')}
      accessibilityValue={{ text: activeLanguage?.nativeName }}>
      <ThemedText variant="label" color="inherit" importantForAccessibility="no">
        {activeLanguage?.flag}
      </ThemedText>
      <ThemedText variant="label" weight="medium">
        {activeLanguage?.nativeName}
      </ThemedText>
      <Ionicons
        name="chevron-down"
        size={14}
        color={isDark ? '#cbd5e1' : '#475569'}
        importantForAccessibility="no"
      />
    </Pressable>
  )
}
