import { ThemedText } from '@/components/ui/ThemedText'
import { ALERT_THEME } from '@/constants/alertTheme'
import type { ScheduledAlert } from '@/stores/alertsStore'
import { useAlertsStore } from '@/stores/alertsStore'
import Ionicons from '@expo/vector-icons/Ionicons'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { Pressable, Switch, View } from 'react-native'

type Props = {
  alert: ScheduledAlert
  onDelete: () => void
  onEdit?: () => void
}

export function AlertListItem({ alert, onDelete, onEdit }: Props) {
  const { t } = useTranslation()
  const toggle = useAlertsStore((s) => s.toggle)

  const scheduledDate = new Date(alert.scheduledAt)
  const isPast = alert.scheduledAt <= Date.now()
  const formattedDate = format(scheduledDate, 'MMM d, yyyy · HH:mm')

  return (
    <View className="mb-2 rounded-xl bg-white p-3 dark:bg-gray-800">
      <View className="flex-row items-start gap-3">
        <View className="flex-1">
          <ThemedText variant="label" weight="semibold" numberOfLines={1}>
            {alert.title}
          </ThemedText>
          {alert.body ? (
            <ThemedText variant="caption" color="muted" numberOfLines={2} className="mt-0.5">
              {alert.body}
            </ThemedText>
          ) : null}
          <View className="mt-1.5 flex-row items-center gap-1">
            <Ionicons
              name={isPast ? 'checkmark-circle-outline' : 'time-outline'}
              size={12}
              color={isPast ? '#6b7280' : ALERT_THEME.primary}
            />
            <ThemedText
              variant="caption"
              color="inherit"
              className={
                isPast ? 'text-gray-500 dark:text-gray-400' : 'text-amber-600 dark:text-amber-400'
              }>
              {formattedDate}
            </ThemedText>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          {onEdit && (
            <Pressable
              onPress={onEdit}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              className="h-9 w-9 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/20"
              accessibilityRole="button"
              accessibilityLabel={t('alerts.edit')}>
              <Ionicons name="create-outline" size={15} color={ALERT_THEME.primaryDark} />
            </Pressable>
          )}

          <Pressable
            onPress={onDelete}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="h-9 w-9 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20"
            accessibilityRole="button"
            accessibilityLabel={t('alerts.delete')}>
            <Ionicons name="trash-outline" size={15} color="#ef4444" />
          </Pressable>
        </View>
      </View>

      <View className="mt-2 flex-row items-center justify-between">
        <ThemedText variant="caption" color="muted">
          {alert.isActive ? t('alerts.active') : t('alerts.triggered')}
        </ThemedText>
        <Switch
          value={alert.isActive}
          onValueChange={() => toggle(alert.id)}
          trackColor={{ false: '#e5e7eb', true: ALERT_THEME.primary }}
          thumbColor="#ffffff"
          accessibilityRole="switch"
          accessibilityLabel={t('alerts.active')}
        />
      </View>
    </View>
  )
}
