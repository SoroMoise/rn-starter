import { AdBanner } from '@/components/ads/AdBanner'
import { RewardedAdButton } from '@/components/ads/RewardedAdButton'
import { AlertsSettingsSection } from '@/components/settings/AlertsSettingsSection'
import { DisplaySection } from '@/components/settings/DisplaySection'
import { LegalSupportSection } from '@/components/settings/LegalSupportSection'
import { PremiumBanner } from '@/components/settings/PremiumBanner'
import { SubscriptionGraceBanner } from '@/components/settings/SubscriptionGraceBanner'
import { Section, SectionContent, SectionHeader } from '@/components/settings/SettingsSection'
import { ScreenContainer } from '@/components/ui/ScreenContainer'
import { ThemedText } from '@/components/ui/ThemedText'
import {
  ADMOB_SETTINGS_BANNER_ID,
  AD_BANNER_SETTINGS_ENABLED,
  AD_REWARDED_ENABLED,
} from '@/constants/admob'
import { usePremium } from '@/hooks/usePremium'
import { loadLanguage } from '@/i18n/service'
import { useAdFree } from '@/providers/AdFreeProvider'
import { useToast } from '@/providers/ToastProvider'
import { analyticsService } from '@/services/api/analyticsService'
import { useSettingsStore } from '@/stores/settingsStore'
import { useShallow } from 'zustand/react/shallow'
import type { Language, ThemeMode, ThemeOption } from '@/types'
import { openExternalLink } from '@/utils/linking'
import { isRTLLanguage } from '@/utils/rtl'
import { LanguagePicker } from '@components/ui/LanguagePicker'
import { ScreenHeading } from '@components/ui/ScreenHeading'
import { SlidingSelector } from '@components/ui/SlidingSelector'
import { RTL_RESTART_BANNER_ENABLED } from '@constants/config'
import { getAppWebsiteUrl } from '@constants/legal'
import { useTabBarPadding } from '@hooks/useTabBarPadding'
import Constants from 'expo-constants'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, TouchableOpacity } from 'react-native'

export default function SettingsScreen() {
  const { t, i18n } = useTranslation()
  const { settings, updateSetting, setLanguage } = useSettingsStore(
    useShallow((s) => ({
      settings: s.settings,
      updateSetting: s.updateSetting,
      setLanguage: s.setLanguage,
    }))
  )
  const { showToast } = useToast()
  const { isAdFreeActive } = useAdFree()
  const { isPremium, isInitialized } = usePremium()

  const showAds = isInitialized && !isAdFreeActive && AD_BANNER_SETTINGS_ENABLED && !isPremium
  const tabBarPadding = useTabBarPadding(showAds ? 60 : 0) + 20

  const [showLanguagePicker, setShowLanguagePicker] = useState(false)

  useEffect(() => {
    if (settings.language !== i18n.language) {
      loadLanguage(settings.language)
      i18n.changeLanguage(settings.language)
    }
  }, [settings.language, i18n])

  const handleThemeChange = (theme: ThemeMode) => {
    analyticsService.track('settings_theme_changed', { theme, previous_theme: settings.theme })
    updateSetting('theme', theme)
  }

  const handleLanguageChange = (language: Language) => {
    analyticsService.track('settings_language_changed', {
      language_code: language,
      previous_language: settings.language,
    })
    void analyticsService.setUserProperty('preferred_language', language)
    setLanguage(language)

    if (RTL_RESTART_BANNER_ENABLED) return

    const directionChanged = isRTLLanguage(settings.language) !== isRTLLanguage(language)
    if (directionChanged) {
      const targetT = i18n.getFixedT(language)
      showToast({ message: targetT('settings.languageChanged'), type: 'success' })
    }
  }

  const themeOptions: ThemeOption[] = [
    { value: 'light', label: t('settings.themeLight'), icon: 'sunny-outline', activeIcon: 'sunny' },
    { value: 'dark', label: t('settings.themeDark'), icon: 'moon-outline', activeIcon: 'moon' },
    {
      value: 'auto',
      label: t('settings.themeAuto'),
      icon: 'phone-portrait-outline',
      activeIcon: 'phone-portrait',
    },
  ]

  const appWebsiteUrl = getAppWebsiteUrl()

  return (
    <ScreenContainer>
      <ScrollView
        className="mx-3 flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          marginTop: 10,
          paddingBottom: tabBarPadding,
        }}>
        <ScreenHeading title={t('settings.title')} subtitle={t('settings.subtitle')} />

        <PremiumBanner />
        <SubscriptionGraceBanner />

        <Section>
          <SectionHeader>{t('settings.appearance')}</SectionHeader>
          <SlidingSelector
            options={themeOptions}
            value={settings.theme}
            onChange={handleThemeChange}
            variant="blue"
          />
        </Section>

        <DisplaySection onOpenLanguagePicker={() => setShowLanguagePicker(true)} />

        {AD_REWARDED_ENABLED && !isPremium && (
          <Section>
            <SectionHeader>{t('settings.ads')}</SectionHeader>
            <SectionContent className="p-4">
              <ThemedText variant="body" weight="medium" className="mb-1">
                {t('settings.removeAds')}
              </ThemedText>
              <ThemedText variant="label" color="muted" weight="normal" className="mb-4">
                {t('settings.removeAdsDescription')}
              </ThemedText>
              <RewardedAdButton />
            </SectionContent>
          </Section>
        )}

        <AlertsSettingsSection />

        <LegalSupportSection />

        <Section className="mb-0">
          <SectionHeader>{t('settings.about')}</SectionHeader>
          <SectionContent overflowHidden={false} className="dark:border-violet-500/30">
            <TouchableOpacity
              onPress={() => {
                if (!appWebsiteUrl) return
                void openExternalLink({ url: appWebsiteUrl })
              }}
              disabled={!appWebsiteUrl}
              activeOpacity={0.6}
              className="items-center py-3">
              <ThemedText variant="body" color="muted" weight="medium">
                {Constants.expoConfig?.name}
              </ThemedText>
              <ThemedText variant="label" color="muted" weight="normal" className="mt-1">
                {t('settings.version')} {Constants.expoConfig?.version}
              </ThemedText>
            </TouchableOpacity>
          </SectionContent>
        </Section>
      </ScrollView>

      <LanguagePicker
        visible={showLanguagePicker}
        onClose={() => setShowLanguagePicker(false)}
        onSelect={handleLanguageChange}
        selectedLanguage={settings.language}
      />

      <AdBanner
        adBannerId={ADMOB_SETTINGS_BANNER_ID}
        screenName="settings"
        enabled={AD_BANNER_SETTINGS_ENABLED}
      />
    </ScreenContainer>
  )
}
