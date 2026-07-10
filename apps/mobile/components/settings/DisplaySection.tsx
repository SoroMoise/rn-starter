import { Section, SectionContent, SectionHeader } from '@/components/settings/SettingsSection'
import { ThemedText } from '@/components/ui/ThemedText'
import { useSettingsStore } from '@/stores/settingsStore'
import { getLanguageByCode } from '@constants/languages'
import { DirectionalIcon } from '@/components/ui/DirectionalIcon'
import Ionicons from '@expo/vector-icons/Ionicons'
import { UI_COLORS } from '@/constants/uiColors'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity, View } from 'react-native'

interface DisplaySectionProps {
  onOpenLanguagePicker: () => void
}

export function DisplaySection({ onOpenLanguagePicker }: DisplaySectionProps) {
  const { t } = useTranslation()
  const language = useSettingsStore((s) => s.settings.language)

  return (
    <Section>
      <SectionHeader>{t('settings.display')}</SectionHeader>
      <SectionContent>
        <TouchableOpacity
          onPress={onOpenLanguagePicker}
          className="flex-row items-center px-4 py-2.5"
          activeOpacity={0.6}>
          <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/20">
            <Ionicons name="language" size={18} color="#8b5cf6" />
          </View>
          <ThemedText variant="body" weight="medium" className="flex-1">
            {t('settings.language')}
          </ThemedText>
          <View className="flex-row items-center gap-1.5">
            <ThemedText color="inherit" className="text-lg">
              {getLanguageByCode(language)?.flag}
            </ThemedText>
            <ThemedText variant="label" color="muted" weight="normal">
              {getLanguageByCode(language)?.nativeName}
            </ThemedText>
            <DirectionalIcon name="chevron-forward" size={16} color={UI_COLORS.chevron} />
          </View>
        </TouchableOpacity>
      </SectionContent>
    </Section>
  )
}
