import { WidgetPreviewCard } from '@/components/widget/WidgetPreviewCard'
import { MotiView } from 'moti'
import { View } from 'react-native'
import { PhoneFrame, PhonePageDots, PhoneStatusBar } from './PhoneFrame'

const MOCK_PAIRS = [
  {
    from: 'EUR',
    to: 'USD',
    rate: 1.0857,
    variationPct: 0.42,
    sparklinePoints: [1.0801, 1.0815, 1.0809, 1.0828, 1.0834, 1.0827, 1.0846, 1.0857],
  },
  {
    from: 'GBP',
    to: 'USD',
    rate: 1.2734,
    variationPct: 0.18,
    sparklinePoints: [1.2702, 1.271, 1.2705, 1.2718, 1.2718, 1.2729, 1.2725, 1.2744],
  },
  {
    from: 'EUR',
    to: 'CHF',
    rate: 0.9563,
    variationPct: -0.21,
    sparklinePoints: [0.9588, 0.958, 0.9585, 0.9572, 0.9569, 0.9575, 0.9566, 0.9563],
  },
]

export function PhoneHomeScreenMock() {
  return (
    <PhoneFrame>
      <PhoneStatusBar />

      <View className="flex-1 justify-center">
        <MotiView
          from={{ translateY: 0 }}
          animate={{ translateY: -10 }}
          transition={{ type: 'timing', duration: 2400, loop: true, repeatReverse: true }}>
          <WidgetPreviewCard pairs={MOCK_PAIRS} />
        </MotiView>
      </View>

      <PhonePageDots active={0} />
    </PhoneFrame>
  )
}
