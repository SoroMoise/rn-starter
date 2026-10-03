import { ThemedText } from '@/components/ui/ThemedText'
import { UI_COLORS } from '@/constants/uiColors'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { useThemedColor } from '@/hooks/useThemedColor'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AccessibilityInfo, Platform, View } from 'react-native'

export function OfflineBanner() {
  const { t } = useTranslation()
  const { isOnline } = useNetworkStatus()
  const isDark = useThemedColor()

  // `accessibilityLiveRegion` is Android only (`BaseViewConfig.android.js`): VoiceOver hears the
  // banner appear only through this announcement.
  useEffect(() => {
    if (!isOnline && Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibility(t('common.offline'))
    }
  }, [isOnline, t])

  if (isOnline) return null

  return (
    <View
      accessibilityLiveRegion="polite"
      className="mb-2 rounded-lg bg-orange-100 px-4 py-2 dark:bg-orange-900/30">
      <View className="flex-row items-center gap-2">
        <Ionicons
          name="cloud-offline"
          size={16}
          color={isDark ? UI_COLORS.offlineDark : UI_COLORS.offline}
          importantForAccessibility="no"
        />
        <ThemedText
          variant="label"
          color="inherit"
          className="text-orange-800 dark:text-orange-300">
          {t('common.offline')}
        </ThemedText>
      </View>
    </View>
  )
}
