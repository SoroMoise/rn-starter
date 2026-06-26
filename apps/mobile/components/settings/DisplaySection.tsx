import {
  Divider,
  Section,
  SectionContent,
  SectionHeader,
} from '@/components/settings/SettingsSection'
import { ThemedText } from '@/components/ui/ThemedText'
import { analyticsService } from '@/services/api/analyticsService'
import { useSettingsStore } from '@/stores/settingsStore'
import { SlidingSelector } from '@components/ui/SlidingSelector'
import { useShallow } from 'zustand/react/shallow'
import { UI_CONFIG } from '@constants/config'
import { getLanguageByCode } from '@constants/languages'
import { DirectionalIcon } from '@/components/ui/DirectionalIcon'
import Ionicons from '@expo/vector-icons/Ionicons'
import { UI_COLORS } from '@/constants/uiColors'
import { useTranslation } from 'react-i18next'
import { Switch, TouchableOpacity, View } from 'react-native'

interface DisplaySectionProps {
  onOpenLanguagePicker: () => void
}

export function DisplaySection({ onOpenLanguagePicker }: DisplaySectionProps) {
  const { t } = useTranslation()
  const { settings, updateSetting } = useSettingsStore(
    useShallow((s) => ({ settings: s.settings, updateSetting: s.updateSetting }))
  )

  const decimalOptions = Array.from(
    { length: UI_CONFIG.MAX_DECIMALS - UI_CONFIG.MIN_DECIMALS + 1 },
    (_, i) => UI_CONFIG.MIN_DECIMALS + i
  )

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
              {getLanguageByCode(settings.language)?.flag}
            </ThemedText>
            <ThemedText variant="label" color="muted" weight="normal">
              {getLanguageByCode(settings.language)?.nativeName}
            </ThemedText>
            <DirectionalIcon name="chevron-forward" size={16} color={UI_COLORS.chevron} />
          </View>
        </TouchableOpacity>

        <Divider />

        <View className="flex-row items-center px-4 py-2.5">
          <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/20">
            <Ionicons name="calculator-outline" size={18} color="#10b981" />
          </View>
          <ThemedText variant="body" weight="medium" className="flex-1">
            {t('settings.thousandSeparator')}
          </ThemedText>
          <Switch
            value={settings.thousandSeparator}
            onValueChange={(v) => {
              analyticsService.track('settings_separator_toggled', { enabled: v })
              updateSetting('thousandSeparator', v)
            }}
            trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
            thumbColor="#ffffff"
          />
        </View>

        <Divider />

        <View className="px-4 py-2.5">
          <View className="mb-3 flex-row items-center">
            <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/20">
              <Ionicons name="options-outline" size={18} color="#f59e0b" />
            </View>
            <ThemedText variant="body" weight="medium" className="flex-1">
              {t('settings.decimals')}
            </ThemedText>
          </View>
          <View className="ml-12 overflow-hidden rounded-xl">
            <SlidingSelector
              options={decimalOptions.map((d) => ({
                value: d,
                label: d === 0 ? t('settings.decimalsNone') : String(d),
              }))}
              value={settings.decimals}
              onChange={(v) => {
                analyticsService.track('settings_decimals_changed', {
                  decimals: v,
                  previous_decimals: settings.decimals,
                })
                updateSetting('decimals', v)
              }}
              variant="white"
            />
          </View>
        </View>
      </SectionContent>
    </Section>
  )
}
