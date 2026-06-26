import { PhoneFrame, PhoneStatusBar } from '@/components/onboarding/PersonaVisualMock/PhoneFrame'
import Ionicons from '@expo/vector-icons/Ionicons'
import { MotiView } from 'moti'
import { useTranslation } from 'react-i18next'
import { Text, View } from 'react-native'

const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.22,
  shadowRadius: 16,
  elevation: 10,
}

export function CleanAppMock() {
  const { t } = useTranslation()
  return (
    <PhoneFrame>
      <PhoneStatusBar />

      <View className="flex-1 justify-center px-3">
        <View className="rounded-2xl border border-white/10 bg-zinc-900 p-4" style={CARD_SHADOW}>
          <View className="flex-row items-center justify-between">
            <Text className="text-[13px] font-bold text-white">{t('tabs.converter')}</Text>
            <Ionicons name="checkmark-circle" size={16} color="#34d399" />
          </View>

          <View className="my-3 h-px bg-white/10" />

          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[10px] font-semibold text-zinc-400">USD</Text>
              <Text className="text-[18px] font-bold text-white">100.00</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color="#71717a" />
            <View className="items-end">
              <Text className="text-[10px] font-semibold text-zinc-400">EUR</Text>
              <Text className="text-[18px] font-bold text-emerald-400">92.34</Text>
            </View>
          </View>

          <View className="mt-4 h-9 items-center justify-center">
            <MotiView
              from={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ type: 'timing', duration: 450, delay: 900 }}
              className="absolute inset-x-0 items-center">
              <View className="w-full items-center rounded-lg bg-orange-500/15 py-2">
                <Text className="text-[11px] text-orange-300/70">
                  {t('onboarding.pitch.mock.ad')}
                </Text>
              </View>
            </MotiView>
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 15, delay: 1350 }}
              className="absolute">
              <View className="flex-row items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1.5">
                <Ionicons name="checkmark-sharp" size={13} color="#34d399" />
                <Text className="text-[11px] font-semibold text-emerald-400">
                  {t('onboarding.pitch.secondaryShort.noAds')}
                </Text>
              </View>
            </MotiView>
          </View>
        </View>
      </View>
    </PhoneFrame>
  )
}
