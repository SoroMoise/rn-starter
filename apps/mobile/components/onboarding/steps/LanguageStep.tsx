import { ThemedText } from '@/components/ui/ThemedText'
import { LANGUAGES } from '@/constants/languages'
import { useSettingsStore } from '@/stores/settingsStore'
import type { Language } from '@/types'
import { triggerSelection } from '@/utils/haptics'
import { useThemedColor } from '@hooks/useThemedColor'
import { LinearGradient } from 'expo-linear-gradient'
import { MotiView } from 'moti'
import { useTranslation } from 'react-i18next'
import { FlatList, TouchableOpacity, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface LanguageStepProps {
  onSelect: (language: Language) => void
}

export function LanguageStep({ onSelect }: LanguageStepProps) {
  const { t } = useTranslation()
  const isDark = useThemedColor()
  const insets = useSafeAreaInsets()
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()
  const currentLanguage = useSettingsStore((s) => s.settings.language)

  const handlePress = (language: Language) => {
    triggerSelection()
    onSelect(language)
  }

  return (
    <View style={{ width: screenWidth, height: screenHeight }} className="flex-1">
      <LinearGradient
        colors={isDark ? ['#0f0c29', '#302b63', '#24243e'] : ['#f8faff', '#eef2ff', '#f5f3ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />

      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', delay: 100, damping: 45 }}
        style={{ paddingTop: insets.top + 80, flex: 1 }}>
        <View className="px-6 pb-4">
          <ThemedText variant="display" align="center" className="text-3xl">
            {t('onboarding.language.title')}
          </ThemedText>
          <ThemedText variant="body" color="muted" align="center" className="mt-2">
            {t('onboarding.language.subtitle')}
          </ThemedText>
        </View>

        <FlatList
          data={LANGUAGES}
          keyExtractor={(item) => item.code}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', delay: 150 + index * 30, duration: 200 }}>
              <TouchableOpacity
                onPress={() => handlePress(item.code as Language)}
                activeOpacity={0.6}
                accessibilityRole="button"
                accessibilityLabel={item.nativeName}
                className={`mb-2 flex-row items-center gap-3 rounded-2xl px-4 py-3 ${
                  currentLanguage === item.code
                    ? isDark
                      ? 'bg-indigo-500/25 border border-indigo-400/40'
                      : 'bg-indigo-500/10 border border-indigo-400/30'
                    : isDark
                      ? 'bg-white/5'
                      : 'bg-black/[0.04]'
                }`}>
                <ThemedText variant="title" color="inherit">
                  {item.flag}
                </ThemedText>
                <View className="flex-1">
                  <ThemedText variant="body" weight="medium">
                    {item.nativeName}
                  </ThemedText>
                </View>
                {currentLanguage === item.code && (
                  <View className="h-5 w-5 items-center justify-center rounded-full bg-indigo-500">
                    <ThemedText variant="caption" color="inverse" weight="bold">
                      ✓
                    </ThemedText>
                  </View>
                )}
              </TouchableOpacity>
            </MotiView>
          )}
        />
      </MotiView>
    </View>
  )
}
