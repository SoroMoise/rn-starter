import { Section, SectionContent } from '@/components/settings/SettingsSection'
import { ThemedText } from '@/components/ui/ThemedText'
import { usePremium } from '@/hooks/usePremium'
import { subscriptionStorage } from '@/services/storage/domains/subscription'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity, View } from 'react-native'

export function PremiumBanner() {
  const { t, i18n } = useTranslation()
  const { isPremium, isInitialized, openPaywall } = usePremium()

  if (!isInitialized) return null

  if (isPremium) {
    const isLifetime = subscriptionStorage.getIsLifetime()
    const expiresAtMs = subscriptionStorage.getExpiresAt()
    const expiryLabel = isLifetime
      ? t('settings.premiumLifetime')
      : expiresAtMs != null
        ? t('settings.premiumActiveUntil', {
            date: new Date(expiresAtMs).toLocaleDateString(i18n.language, {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }),
          })
        : null

    return (
      <Section>
        <SectionContent>
          <View className="flex-row items-center px-4 py-3.5">
            <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/20">
              <Ionicons name="star" size={18} color="#8b5cf6" />
            </View>
            <View className="flex-1">
              <ThemedText variant="body" weight="medium">
                {t('settings.premiumActive')}
              </ThemedText>
              {expiryLabel != null && (
                <ThemedText variant="caption" color="muted" weight="normal">
                  {expiryLabel}
                </ThemedText>
              )}
            </View>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          </View>
        </SectionContent>
      </Section>
    )
  }

  return (
    <Section>
      <TouchableOpacity
        onPress={() => void openPaywall({ source: 'settings' })}
        activeOpacity={0.85}
        className="overflow-hidden rounded-2xl bg-violet-600 dark:bg-violet-700">
        <View className="p-4">
          <View className="mb-2 flex-row items-center gap-2">
            <Ionicons name="star" size={16} color="#fbbf24" />
            <ThemedText color="inherit" weight="bold" className="text-base text-white">
              {t('paywall.title')}
            </ThemedText>
          </View>
          <ThemedText color="inherit" className="mb-3 text-sm text-violet-200">
            {t('settings.premiumDescription')}
          </ThemedText>
          <View className="self-start rounded-full bg-white px-4 py-1.5">
            <ThemedText color="inherit" weight="bold" className="text-sm text-violet-700">
              {t('settings.goPremium')}
            </ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    </Section>
  )
}
