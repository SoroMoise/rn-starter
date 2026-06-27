import { GradientButton } from '@/components/ui/GradientButton'
import { ScreenContainer } from '@/components/ui/ScreenContainer'
import { ScreenHeading } from '@/components/ui/ScreenHeading'
import { ThemedText } from '@/components/ui/ThemedText'
import { usePremium } from '@/hooks/usePremium'
import { useTabBarPadding } from '@/hooks/useTabBarPadding'
import Ionicons from '@expo/vector-icons/Ionicons'
import { MotiView } from 'moti'
import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

interface FeatureItem {
  key: string
  icon: IoniconName
}

const FEATURE_ITEMS: FeatureItem[] = [
  { key: 'theme', icon: 'color-palette-outline' },
  { key: 'i18n', icon: 'language-outline' },
  { key: 'paywall', icon: 'card-outline' },
  { key: 'ads', icon: 'megaphone-outline' },
  { key: 'notifications', icon: 'notifications-outline' },
]

export default function HomeScreen() {
  const { t } = useTranslation()
  const { openPaywall } = usePremium()
  const tabBarPadding = useTabBarPadding(24)

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: tabBarPadding }}
        showsVerticalScrollIndicator={false}>

        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}>
          <View className="mx-5 mt-6">
            <ScreenHeading
              title={t('home.hero.title')}
              subtitle={t('home.hero.subtitle')}
              className="mb-6"
            />
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 120 }}>
          <View className="mx-5 mb-4 rounded-2xl bg-white px-5 py-4 dark:bg-gray-800">
            <ThemedText variant="sectionHeader" color="muted" className="mb-3">
              {t('home.features.title')}
            </ThemedText>
            {FEATURE_ITEMS.map((feat, index) => (
              <View
                key={feat.key}
                className={`flex-row items-center gap-3 py-2.5${
                  index < FEATURE_ITEMS.length - 1
                    ? ' border-b border-gray-100 dark:border-gray-700'
                    : ''
                }`}>
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30">
                  <Ionicons name={feat.icon} size={18} color="#3b82f6" />
                </View>
                <View className="flex-1">
                  <ThemedText variant="label" weight="semibold">
                    {t(`home.features.${feat.key}.label`)}
                  </ThemedText>
                  <ThemedText variant="caption" color="muted" className="mt-0.5">
                    {t(`home.features.${feat.key}.desc`)}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 240 }}>
          <View className="mx-5 mt-2">
            <GradientButton
              onPress={() => void openPaywall({ source: 'home_cta' })}
              colors={['#3b82f6', '#6366f1', '#8b5cf6']}
              style={{ height: 58, borderRadius: 16 }}
              gradientStyle={{ height: '100%', gap: 10 }}
              accessibilityLabel={t('home.cta.label')}>
              <ThemedText variant="buttonLarge" color="inverse">
                {t('home.cta.label')}
              </ThemedText>
              <Ionicons name="arrow-forward" size={20} color="#ffffff" />
            </GradientButton>
            <ThemedText variant="caption" color="muted" align="center" className="mt-2">
              {t('home.cta.sub')}
            </ThemedText>
          </View>
        </MotiView>

      </ScrollView>
    </ScreenContainer>
  )
}
