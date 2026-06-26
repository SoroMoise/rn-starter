import { GradientButton } from '@/components/ui/GradientButton'
import { ModalBottomSheet } from '@/components/ui/ModalBottomSheet'
import { ThemedText } from '@/components/ui/ThemedText'
import { WheelPicker } from '@/components/ui/WheelPicker'
import { ALERT_THEME } from '@/constants/alertTheme'
import { formatQuietWindowDuration } from '@/utils/quietHours'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => ({
  value: h,
  label: h.toString().padStart(2, '0'),
}))

const MINUTE_STEPS = [0, 15, 30, 45]
const MINUTE_OPTIONS = MINUTE_STEPS.map((m) => ({
  value: m,
  label: m.toString().padStart(2, '0'),
}))

function parseHHMM(value: string): { hour: number; minute: number } {
  const [h, m] = value.split(':').map(Number)
  const hour = Number.isFinite(h) ? Math.max(0, Math.min(23, h)) : 22
  const rawMinute = Number.isFinite(m) ? m : 0
  const minute = MINUTE_STEPS.reduce(
    (closest, step) =>
      Math.abs(step - rawMinute) < Math.abs(closest - rawMinute) ? step : closest,
    MINUTE_STEPS[0]
  )
  return { hour, minute }
}

function toHHMM(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
}

interface Props {
  visible: boolean
  onClose: () => void
  initialStart: string
  initialEnd: string
  onSave: (range: { start: string; end: string }) => void
}

export function QuietHoursSheet({ visible, onClose, initialStart, initialEnd, onSave }: Props) {
  const { t } = useTranslation()

  const [start, setStart] = useState(() => parseHHMM(initialStart))
  const [end, setEnd] = useState(() => parseHHMM(initialEnd))

  useEffect(() => {
    if (!visible) return
    setStart(parseHHMM(initialStart))
    setEnd(parseHHMM(initialEnd))
  }, [visible, initialStart, initialEnd])

  const startHHMM = toHHMM(start.hour, start.minute)
  const endHHMM = toHHMM(end.hour, end.minute)

  const durationMin = useMemo(
    () => formatQuietWindowDuration({ start: startHHMM, end: endHHMM }),
    [startHHMM, endHHMM]
  )

  const hours = Math.floor(durationMin / 60)
  const minutes = durationMin % 60

  const handleSave = () => {
    onSave({ start: startHHMM, end: endHHMM })
    onClose()
  }

  return (
    <ModalBottomSheet
      visible={visible}
      onClose={onClose}
      title={t('alerts.preferences.quietHours')}
      compact>
      <View className="px-6 pb-6">
        <View className="flex-row justify-between gap-4">
          <View className="flex-1 items-center">
            <ThemedText variant="label" weight="semibold" color="muted" className="mb-3 uppercase">
              {t('alerts.preferences.quietHoursStart')}
            </ThemedText>
            <View className="flex-row items-center gap-2">
              <WheelPicker
                options={HOUR_OPTIONS}
                value={start.hour}
                onChange={(hour) => setStart((s) => ({ ...s, hour }))}
              />
              <ThemedText variant="heading" weight="bold" color="muted">
                :
              </ThemedText>
              <WheelPicker
                options={MINUTE_OPTIONS}
                value={start.minute}
                onChange={(minute) => setStart((s) => ({ ...s, minute }))}
              />
            </View>
          </View>

          <View className="flex-1 items-center">
            <ThemedText variant="label" weight="semibold" color="muted" className="mb-3 uppercase">
              {t('alerts.preferences.quietHoursEnd')}
            </ThemedText>
            <View className="flex-row items-center gap-2">
              <WheelPicker
                options={HOUR_OPTIONS}
                value={end.hour}
                onChange={(hour) => setEnd((s) => ({ ...s, hour }))}
              />
              <ThemedText variant="heading" weight="bold" color="muted">
                :
              </ThemedText>
              <WheelPicker
                options={MINUTE_OPTIONS}
                value={end.minute}
                onChange={(minute) => setEnd((s) => ({ ...s, minute }))}
              />
            </View>
          </View>
        </View>

        <View className="mt-6 items-center">
          <ThemedText variant="body" color="muted" align="center">
            {durationMin === 0
              ? t('alerts.preferences.quietHoursInvalid')
              : t('alerts.preferences.quietHoursDuration', {
                  hours,
                  minutes: minutes.toString().padStart(2, '0'),
                })}
          </ThemedText>
        </View>

        <View className="mt-6">
          <GradientButton
            onPress={handleSave}
            colors={ALERT_THEME.gradient}
            style={{ width: '100%', borderRadius: 14 }}>
            <ThemedText variant="button" color="inverse">
              {t('common.save')}
            </ThemedText>
          </GradientButton>
        </View>
      </View>
    </ModalBottomSheet>
  )
}
