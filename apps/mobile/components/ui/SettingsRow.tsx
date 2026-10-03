import { AppSwitch } from '@/components/ui/AppSwitch'
import { DirectionalIcon } from '@/components/ui/DirectionalIcon'
import { ProBadge } from '@/components/ui/ProBadge'
import { ThemedText } from '@/components/ui/ThemedText'
import { UI_COLORS } from '@/constants/uiColors'
import Ionicons from '@expo/vector-icons/Ionicons'
import type { ComponentProps, ReactNode } from 'react'
import { TouchableOpacity, View } from 'react-native'

type SettingsRowProps = {
  icon: ComponentProps<typeof Ionicons>['name']
  title: string
  iconBgClassName?: string
  iconColor?: string
  description?: string
  value?: string
  pro?: boolean
  // Makes the whole row the switch: it draws an AppSwitch and carries the switch role and state.
  toggle?: boolean
  chevron?: boolean
  accessory?: ReactNode
  onPress?: () => void
  disabled?: boolean
}

export function SettingsRow({
  icon,
  title,
  iconBgClassName = 'bg-accent-50 dark:bg-accent-500/20',
  iconColor = UI_COLORS.accent[500],
  description,
  value,
  pro = false,
  toggle,
  chevron = toggle === undefined,
  accessory,
  onPress,
  disabled = false,
}: SettingsRowProps) {
  const isSwitch = toggle !== undefined

  const content = (
    <>
      <View className={`h-9 w-9 items-center justify-center rounded-xl ${iconBgClassName}`}>
        <Ionicons name={icon} size={18} color={iconColor} importantForAccessibility="no" />
      </View>

      <View className="flex-1">
        <ThemedText variant="body" weight="medium">
          {title}
        </ThemedText>
        {description ? (
          <ThemedText variant="caption" color="muted">
            {description}
          </ThemedText>
        ) : null}
      </View>

      {pro ? <ProBadge /> : null}
      {value ? (
        <ThemedText variant="label" color="muted" weight="normal" className="shrink">
          {value}
        </ThemedText>
      ) : null}
      {accessory}
      {isSwitch ? <AppSwitch value={toggle} /> : null}
      {chevron ? (
        <DirectionalIcon name="chevron-forward" size={16} color={UI_COLORS.chevron} />
      ) : null}
    </>
  )

  if (!onPress && !isSwitch) {
    return (
      <View accessible className={ROW_CLASS_NAME}>
        {content}
      </View>
    )
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || !onPress}
      activeOpacity={0.6}
      accessibilityRole={isSwitch ? 'switch' : 'button'}
      accessibilityState={{ checked: toggle, disabled: disabled || !onPress }}
      className={ROW_CLASS_NAME}>
      {content}
    </TouchableOpacity>
  )
}

const ROW_CLASS_NAME = 'flex-row items-center gap-3 px-4 py-3.5'
