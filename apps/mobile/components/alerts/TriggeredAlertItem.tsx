import { ThemedText } from '@/components/ui/ThemedText'
import type { ScheduledAlert } from '@/stores/alertsStore'
import { useAlertsStore } from '@/stores/alertsStore'
import Ionicons from '@expo/vector-icons/Ionicons'
import { format, formatDistanceToNow } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

type Props = {
  alert: ScheduledAlert
  onDelete: () => void
}

export function TriggeredAlertItem({ alert, onDelete }: Props) {
  const { t } = useTranslation()
  const toggle = useAlertsStore((s) => s.toggle)

  const scheduledDate = new Date(alert.scheduledAt)
  const timeAgo = formatDistanceToNow(scheduledDate, { addSuffix: true })
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
            <Ionicons name="time-outline" size={12} color="#6b7280" />
            <ThemedText variant="caption" color="muted">
              {formattedDate}
            </ThemedText>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => toggle(alert.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="h-9 w-9 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/30"
            accessibilityRole="button"
            accessibilityLabel={t('alerts.active')}>
            <Ionicons name="refresh" size={15} color="#d97706" />
          </Pressable>
          <Pressable
            onPress={onDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="h-9 w-9 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20"
            accessibilityRole="button"
            accessibilityLabel={t('alerts.delete')}>
            <Ionicons name="trash-outline" size={15} color="#ef4444" />
          </Pressable>
        </View>
      </View>

      <View className="mt-2 flex-row items-center gap-1.5 self-start rounded-md bg-gray-100 px-2 py-0.5 dark:bg-gray-700">
        <Ionicons name="checkmark-circle" size={11} color="#6b7280" />
        <ThemedText variant="caption" weight="medium" color="muted">
          {timeAgo}
        </ThemedText>
      </View>
    </View>
  )
}
