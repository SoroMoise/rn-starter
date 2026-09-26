import { Section, SectionContent, SectionHeader } from '@/components/settings/SettingsSection'
import { SettingsRow } from '@/components/ui/SettingsRow'
import { ThemedText } from '@/components/ui/ThemedText'
import { UI_COLORS } from '@/constants/uiColors'
import { useSettingsStore } from '@/stores/settingsStore'
import { getLanguageByCode } from '@constants/languages'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

interface DisplaySectionProps {
  onOpenLanguagePicker: () => void
}

export function DisplaySection({ onOpenLanguagePicker }: DisplaySectionProps) {
  const { t } = useTranslation()
  const language = useSettingsStore((s) => s.settings.language)
  const activeLanguage = getLanguageByCode(language)

  return (
    <Section>
      <SectionHeader>{t('settings.display')}</SectionHeader>
      <SectionContent>
        <SettingsRow
          icon="language"
          iconBgClassName="bg-violet-100 dark:bg-violet-500/20"
          iconColor={UI_COLORS.brand}
          title={t('settings.language')}
          accessory={
            <View className="flex-row items-center gap-1.5">
              <ThemedText color="inherit" className="text-lg">
                {activeLanguage?.flag}
              </ThemedText>
              <ThemedText variant="label" color="muted" weight="normal">
                {activeLanguage?.nativeName}
              </ThemedText>
            </View>
          }
          onPress={onOpenLanguagePicker}
        />
      </SectionContent>
    </Section>
  )
}
