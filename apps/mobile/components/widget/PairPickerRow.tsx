import { ThemedText } from '@/components/ui/ThemedText'
import { getCurrencyByCode } from '@/constants/currencies'
import { triggerMedium } from '@/utils/haptics'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

export function PairPickerRow({
  index,
  from,
  to,
  onEditFrom,
  onEditTo,
  onSwap,
  onDrag,
  isActive = false,
  draggable = false,
}: {
  index: number
  from: string
  to: string
  onEditFrom: () => void
  onEditTo: () => void
  onSwap: () => void
  onDrag?: () => void
  isActive?: boolean
  draggable?: boolean
}) {
  const { t } = useTranslation()
  const rotation = useSharedValue(0)

  const swapStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }))

  const handleSwap = useCallback(() => {
    rotation.value = withTiming(rotation.value + 180, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    })
    triggerMedium()
    onSwap()
  }, [onSwap, rotation])

  return (
    <View
      className={`flex-row items-center gap-1.5 rounded-2xl p-1 ${
        isActive ? 'bg-gray-100 dark:bg-gray-800' : ''
      }`}>
      {draggable ? (
        <Pressable
          onPressIn={onDrag}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${from} ${to}`}
          className="h-8 w-6 items-center justify-center active:opacity-60">
          <Ionicons name="reorder-three" size={20} color="#9ca3af" />
        </Pressable>
      ) : (
        <ThemedText variant="body" color="muted" weight="medium" className="w-6 text-center">
          {index + 1}.
        </ThemedText>
      )}

      <CurrencyChip code={from} onPress={onEditFrom} />

      <Pressable
        onPress={handleSwap}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={t('a11y.swapCurrencies')}
        className="h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white active:opacity-70 dark:border-gray-700 dark:bg-gray-800">
        <Animated.View style={swapStyle}>
          <Ionicons name="swap-horizontal" size={18} color="#9ca3af" />
        </Animated.View>
      </Pressable>

      <CurrencyChip code={to} onPress={onEditTo} />
    </View>
  )
}

function CurrencyChip({ code, onPress }: { code: string; onPress: () => void }) {
  const flag = getCurrencyByCode(code).flag

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={code}
      className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2 py-2.5 active:opacity-80 dark:border-gray-700 dark:bg-gray-800">
      <ThemedText color="inherit" className="text-lg">
        {flag}
      </ThemedText>
      <ThemedText variant="body" weight="semibold">
        {code}
      </ThemedText>
    </Pressable>
  )
}
