import { GradientButton } from '@/components/ui/GradientButton'
import { ModalBottomSheetScrollView } from '@/components/ui/ModalBottomSheet'
import { ThemedText } from '@/components/ui/ThemedText'
import { WheelPicker } from '@/components/ui/WheelPicker'
import { ALERT_THEME } from '@/constants/alertTheme'
import { useToast } from '@/providers/ToastProvider'
import { scheduleAlertNotification, cancelAlertNotification } from '@/services/notifications/scheduleAlert'
import { useAlertsStore, type ScheduledAlert } from '@/stores/alertsStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { triggerError, triggerSuccess } from '@/utils/haptics'
import { addDays, addHours, format, startOfDay, setHours, setMinutes } from 'date-fns'
import { useMemo, useRef, useState, type ComponentRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, Platform, Switch, TextInput, View } from 'react-native'

type Props = {
  onSuccess: () => void
  editingAlert?: ScheduledAlert
}

function buildScheduledAt(dayOffset: number, hour: number, minute: number): number {
  const base = startOfDay(new Date())
  const d = addDays(base, dayOffset)
  return setMinutes(setHours(d, hour), minute).getTime()
}

function makeDayOptions(): { value: number; label: string }[] {
  const today = new Date()
  return [0, 1, 2, 3, 7, 14, 30].map((offset) => {
    const d = addDays(today, offset)
    const label =
      offset === 0
        ? 'Today'
        : offset === 1
          ? 'Tomorrow'
          : format(d, 'EEE, MMM d')
    return { value: offset, label }
  })
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: String(i).padStart(2, '0'),
}))

const MINUTE_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => ({
  value: m,
  label: String(m).padStart(2, '0'),
}))

function resolveInitialDay(ts: number): number {
  const today = startOfDay(new Date())
  const target = startOfDay(new Date(ts))
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000)
  const dayOptions = makeDayOptions()
  const found = dayOptions.find((d) => d.value === diff)
  return found ? diff : 0
}

export function CreateAlertForm({ onSuccess, editingAlert }: Props) {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const add = useAlertsStore((s) => s.add)
  const remove = useAlertsStore((s) => s.remove)
  const notificationSound = useSettingsStore((s) => s.settings.notificationSound)

  const isEditing = editingAlert != null
  const scrollRef = useRef<ComponentRef<typeof ModalBottomSheetScrollView>>(null)

  const [title, setTitle] = useState(editingAlert?.title ?? '')
  const [body, setBody] = useState(editingAlert?.body ?? '')
  const [isActive, setIsActive] = useState(editingAlert?.isActive ?? true)

  const initialTs = editingAlert?.scheduledAt ?? addHours(new Date(), 1).getTime()
  const [dayOffset, setDayOffset] = useState(resolveInitialDay(initialTs))
  const [hour, setHour] = useState(new Date(initialTs).getHours())
  const [minute, setMinute] = useState(
    // snap to nearest 5
    Math.round(new Date(initialTs).getMinutes() / 5) * 5
  )

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dayOptions = useMemo(() => makeDayOptions(), [])

  const scheduledAt = buildScheduledAt(dayOffset, hour, minute)

  const handleSubmit = async () => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      triggerError()
      setError(t('error.invalidAmount', { defaultValue: 'Please enter a title.' }))
      return
    }
    if (scheduledAt <= Date.now() && isActive) {
      triggerError()
      setError('Scheduled time must be in the future for an active reminder.')
      return
    }

    setError(null)
    setIsSubmitting(true)
    Keyboard.dismiss()

    try {
      if (isEditing && editingAlert) {
        // Remove old alert + cancel its notification, then add updated
        await cancelAlertNotification(editingAlert.id)
        remove(editingAlert.id)
      }

      const alert = add({ title: trimmedTitle, body: body.trim(), scheduledAt, isActive })

      if (isActive && scheduledAt > Date.now()) {
        await scheduleAlertNotification({ alert, sound: notificationSound })
      }

      triggerSuccess()
      showToast({
        message: isEditing ? t('alerts.updateSuccess', { pair: '' }) : t('alerts.create'),
        type: 'success',
      })
      onSuccess()
    } catch {
      triggerError()
      showToast({ message: t('error.unknownError'), type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitDisabled = isSubmitting || title.trim().length === 0

  return (
    <ModalBottomSheetScrollView
      ref={scrollRef}
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingTop: 4,
        paddingBottom: 32,
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag">

      {/* Title */}
      <View className="mb-4">
        <ThemedText variant="label" color="muted" className="mb-2">
          {t('alerts.title', { defaultValue: 'Title' })}
        </ThemedText>
        <TextInput
          value={title}
          onChangeText={(v) => {
            setTitle(v)
            setError(null)
          }}
          onFocus={() => scrollRef.current?.scrollToEnd({ animated: true })}
          placeholder="Reminder title"
          maxLength={64}
          returnKeyType={Platform.OS === 'ios' ? 'done' : 'next'}
          onSubmitEditing={Keyboard.dismiss}
          className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      </View>

      {/* Body */}
      <View className="mb-4">
        <ThemedText variant="label" color="muted" className="mb-2">
          Message{' '}
          <ThemedText variant="caption" color="muted">
            (optional)
          </ThemedText>
        </ThemedText>
        <TextInput
          value={body}
          onChangeText={setBody}
          onFocus={() => scrollRef.current?.scrollToEnd({ animated: true })}
          placeholder="Optional message"
          maxLength={256}
          multiline
          numberOfLines={3}
          returnKeyType="default"
          className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          style={{ minHeight: 80, textAlignVertical: 'top' }}
        />
      </View>

      {/* Date & time picker */}
      <View className="mb-4">
        <ThemedText variant="label" color="muted" className="mb-3">
          When
        </ThemedText>
        <View className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800">
          <View className="flex-row items-center justify-center gap-3 px-4 py-2">
            {/* Day */}
            <View className="flex-1 items-center">
              <ThemedText variant="caption" color="muted" className="mb-1">
                Day
              </ThemedText>
              <WheelPicker
                options={dayOptions}
                value={dayOffset}
                onChange={setDayOffset}
                width={120}
              />
            </View>

            {/* Hour */}
            <View className="items-center">
              <ThemedText variant="caption" color="muted" className="mb-1">
                Hour
              </ThemedText>
              <WheelPicker
                options={HOUR_OPTIONS}
                value={hour}
                onChange={setHour}
                width={60}
              />
            </View>

            <ThemedText variant="heading" weight="bold" color="muted">
              :
            </ThemedText>

            {/* Minute */}
            <View className="items-center">
              <ThemedText variant="caption" color="muted" className="mb-1">
                Min
              </ThemedText>
              <WheelPicker
                options={MINUTE_OPTIONS}
                value={minute}
                onChange={setMinute}
                width={60}
              />
            </View>
          </View>

          <View className="border-t border-gray-100 px-4 py-2 dark:border-gray-700">
            <ThemedText variant="caption" color="muted" align="center">
              {format(new Date(scheduledAt), 'EEEE, MMMM d, yyyy · HH:mm')}
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Active toggle */}
      <View className="mb-6 flex-row items-center justify-between rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
        <ThemedText variant="label" weight="medium">
          {t('alerts.active', { defaultValue: 'Active' })}
        </ThemedText>
        <Switch
          value={isActive}
          onValueChange={setIsActive}
          trackColor={{ false: '#e5e7eb', true: ALERT_THEME.primary }}
          thumbColor="#ffffff"
        />
      </View>

      {error != null && (
        <ThemedText variant="caption" color="error" className="mb-3">
          {error}
        </ThemedText>
      )}

      <GradientButton
        onPress={() => void handleSubmit()}
        colors={ALERT_THEME.gradient}
        disabled={submitDisabled}
        isLoading={isSubmitting}>
        <ThemedText variant="button" color="inverse">
          {isEditing ? t('alerts.save') : t('alerts.create')}
        </ThemedText>
      </GradientButton>
    </ModalBottomSheetScrollView>
  )
}
