import Ionicons from '@expo/vector-icons/Ionicons'
import { DirectionalIcon } from '@/components/ui/DirectionalIcon'
import { UI_COLORS } from '@/constants/uiColors'
import { useThemedColor } from '@hooks/useThemedColor'
import { TouchableOpacity, View } from 'react-native'

import { ThemedText } from '@/components/ui/ThemedText'

export type SettingsLinkRowProps = {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  onPress: () => void
  role?: 'link' | 'button'
}

export function SettingsLinkRow({ icon, label, onPress, role = 'link' }: SettingsLinkRowProps) {
  const isDark = useThemedColor()
  const mutedIconColor = isDark ? '#fff' : '#4b5563'

  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole={role}
      accessibilityLabel={label}
      className="min-h-[52px] flex-row items-center px-4 py-2"
      activeOpacity={0.6}>
      <View className="mr-3 h-9 w-9 items-center justify-center">
        <Ionicons name={icon} size={18} color={mutedIconColor} importantForAccessibility="no" />
      </View>
      <ThemedText variant="body" color="dimmed" weight="medium" className="flex-1">
        {label}
      </ThemedText>
      <DirectionalIcon name="chevron-forward" size={16} color={UI_COLORS.chevron} />
    </TouchableOpacity>
  )
}
