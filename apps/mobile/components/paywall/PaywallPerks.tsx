import { ThemedText } from '@/components/ui/ThemedText'
import { PRO_BENEFITS } from '@/constants/purchases'
import { UI_COLORS } from '@/constants/uiColors'
import { useThemedColor } from '@/hooks/useThemedColor'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

export function PaywallPerks() {
  const { t } = useTranslation()
  const isDark = useThemedColor()

  return (
    <View className="rounded-2xl bg-white px-4 dark:bg-white/5">
      {PRO_BENEFITS.map((benefit, index) => (
        <View
          key={benefit.key}
          className="flex-row items-center gap-3 py-3"
          style={
            index < PRO_BENEFITS.length - 1 && [styles.rowBorder, isDark && styles.rowBorderDark]
          }>
          <Ionicons name={benefit.icon} size={20} color={UI_COLORS.brand} />
          <ThemedText variant="body" weight="medium" className="flex-1">
            {t(benefit.i18nKey, benefit.params)}
          </ThemedText>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  rowBorderDark: {
    borderBottomColor: '#374151',
  },
})
