import { MotiView } from 'moti'
import { Text, View } from 'react-native'
import { PhoneFrame, PhonePageDots, PhoneStatusBar } from './PhoneFrame'

const MOCK_ROWS = [
  { label: 'Premium', value: '✓', sub: 'Active', positive: true },
  { label: 'Notifications', value: '3', sub: 'new alerts', positive: true },
  { label: 'Sync', value: '↑', sub: 'Cloud backup', positive: true },
]

export function PhoneHomeScreenMock() {
  return (
    <PhoneFrame>
      <PhoneStatusBar />

      <View className="flex-1 justify-center px-3">
        <MotiView
          from={{ translateY: 0 }}
          animate={{ translateY: -10 }}
          transition={{ type: 'timing', duration: 2400, loop: true, repeatReverse: true }}>
          <View
            className="rounded-2xl border border-white/10 bg-zinc-900 p-4"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 10,
            }}>
            <Text className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
              Overview
            </Text>
            {MOCK_ROWS.map((row) => (
              <View key={row.label} className="mb-2 flex-row items-center justify-between">
                <Text className="text-[12px] font-medium text-zinc-400">{row.label}</Text>
                <View className="flex-row items-center gap-1.5">
                  <Text className={`text-[12px] font-bold ${row.positive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {row.value}
                  </Text>
                  <Text className="text-[10px] text-zinc-500">{row.sub}</Text>
                </View>
              </View>
            ))}
          </View>
        </MotiView>
      </View>

      <PhonePageDots active={0} />
    </PhoneFrame>
  )
}
