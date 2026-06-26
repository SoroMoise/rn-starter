import { PhoneFrame, PhoneStatusBar } from '@/components/onboarding/PersonaVisualMock/PhoneFrame'
import type { Language } from '@/types'
import { formatClockTime } from '@/utils/time'
import Ionicons from '@expo/vector-icons/Ionicons'
import { LinearGradient } from 'expo-linear-gradient'
import { MotiView } from 'moti'
import { useTranslation } from 'react-i18next'
import { Text, View } from 'react-native'

interface AlertItem {
  icon: keyof typeof Ionicons.glyphMap
  accent: readonly [string, string]
  messageKey: string
  minutesAgo: number
}

const ALERTS: AlertItem[] = [
  {
    icon: 'flag',
    accent: ['#3b82f6', '#6366f1'],
    messageKey: 'onboarding.pitch.mock.alertTarget',
    minutesAgo: 0,
  },
  {
    icon: 'trending-up',
    accent: ['#10b981', '#34d399'],
    messageKey: 'onboarding.pitch.mock.alertVariation',
    minutesAgo: 2,
  },
]

const BANNER_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.18,
  shadowRadius: 14,
  elevation: 8,
}

export function AlertNotificationMock() {
  const { t, i18n } = useTranslation()
  const now = Date.now()

  return (
    <PhoneFrame>
      <PhoneStatusBar />

      <MotiView
        from={{ translateY: 0 }}
        animate={{ translateY: -5 }}
        transition={{ type: 'timing', duration: 2600, loop: true, repeatReverse: true }}
        className="mt-5 gap-2.5 px-3">
        {ALERTS.map((alert, index) => (
          <MotiView
            key={alert.messageKey}
            from={{ opacity: 0, translateY: -18, scale: 0.96 }}
            animate={{ opacity: 1, translateY: 0, scale: 1 }}
            transition={{ type: 'spring', damping: 35, delay: 200 + index * 240 }}>
            <View
              className="flex-row items-start gap-2.5 rounded-2xl border border-white/10 bg-zinc-900/95 p-2.5"
              style={BANNER_SHADOW}>
              <LinearGradient
                colors={alert.accent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 9 }}
                className="h-8 w-8 items-center justify-center">
                <Ionicons name={alert.icon} size={16} color="#FFFFFF" />
              </LinearGradient>
              <View className="flex-1">
                <View className="flex-row items-center justify-between">
                  <Text className="flex-1 text-[11px] font-bold text-white" numberOfLines={1}>
                    {t('common.appName')}
                  </Text>
                  <Text className="ml-2 text-[10px] text-zinc-500">
                    {formatClockTime(now - alert.minutesAgo * 60000, i18n.language as Language)}
                  </Text>
                </View>
                <Text className="mt-0.5 text-[11px] text-zinc-300" numberOfLines={1}>
                  {t(alert.messageKey)}
                </Text>
              </View>
            </View>
          </MotiView>
        ))}
      </MotiView>
    </PhoneFrame>
  )
}
