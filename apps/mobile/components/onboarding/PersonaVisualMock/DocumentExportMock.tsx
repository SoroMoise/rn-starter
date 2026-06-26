import { PhoneFrame, PhoneStatusBar } from '@/components/onboarding/PersonaVisualMock/PhoneFrame'
import type { Language } from '@/types'
import { formatMonthYear } from '@/utils/time'
import Ionicons from '@expo/vector-icons/Ionicons'
import { LinearGradient } from 'expo-linear-gradient'
import { MotiView } from 'moti'
import { useTranslation } from 'react-i18next'
import { Text, View } from 'react-native'

const ROWS = [
  { code: 'USD', amount: '$1,250.00' },
  { code: 'EUR', amount: '€1,151.25' },
  { code: 'GBP', amount: '£991.50' },
  { code: 'JPY', amount: '¥195,375' },
]

const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.22,
  shadowRadius: 16,
  elevation: 10,
}

export function DocumentExportMock() {
  const { t, i18n } = useTranslation()

  return (
    <PhoneFrame height={270}>
      <PhoneStatusBar />

      <View className="flex-1 justify-center px-3">
        <View className="rounded-2xl border border-white/10 bg-zinc-900 p-4" style={CARD_SHADOW}>
          <View className="flex-row items-center gap-3">
            <LinearGradient
              colors={['#3b82f6', '#6366f1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 10 }}
              className="h-9 w-9 items-center justify-center">
              <Ionicons name="document-text" size={18} color="#FFFFFF" />
            </LinearGradient>
            <View className="flex-1">
              <Text className="text-[13px] font-bold text-white">
                {t('onboarding.pitch.mock.reportTitle')}
              </Text>
              <Text className="text-[10px] text-zinc-400">
                {formatMonthYear(new Date(), i18n.language as Language)}
              </Text>
            </View>
            <View className="rounded-md bg-rose-500/90 px-1.5 py-0.5">
              <Text className="text-[9px] font-bold text-white">PDF</Text>
            </View>
          </View>

          <View className="my-3 h-px bg-white/10" />

          {ROWS.map((row, index) => (
            <MotiView
              key={row.code}
              from={{ opacity: 0, translateX: -6 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: 320, delay: 350 + index * 130 }}>
              <View className="flex-row items-center justify-between py-1">
                <Text className="text-[12px] font-semibold text-zinc-400">{row.code}</Text>
                <Text className="text-[12px] font-semibold text-white">{row.amount}</Text>
              </View>
            </MotiView>
          ))}

          <View className="my-3 h-px bg-white/10" />

          <View className="flex-row items-center gap-1.5">
            <Ionicons name="cloud-done" size={13} color="#34d399" />
            <Text className="text-[10px] text-zinc-400">
              {t('onboarding.pitch.mock.syncedToDrive')}
            </Text>
          </View>
        </View>
      </View>
    </PhoneFrame>
  )
}
