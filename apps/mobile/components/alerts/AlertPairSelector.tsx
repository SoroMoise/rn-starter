import { ThemedText } from '@/components/ui/ThemedText'
import type { Currency, Language } from '@/types'
import { getCurrencyName } from '@/utils'
import { triggerMedium } from '@/utils/haptics'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, TouchableOpacity, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

type Props = {
  fromCurrency: Currency
  toCurrency: Currency
  onFromPress: () => void
  onToPress: () => void
  onSwap: () => void
}

export function AlertPairSelector({
  fromCurrency,
  toCurrency,
  onFromPress,
  onToPress,
  onSwap,
}: Props) {
  const rotation = useSharedValue(0)
  const { t } = useTranslation()

  const animatedStyle = useAnimatedStyle(() => ({
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
    <View className="mb-4 flex-row items-center gap-0.5">
      <CurrencyButton currency={fromCurrency} onPress={onFromPress} />
      <Pressable
        onPress={handleSwap}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t('a11y.swapCurrencies')}>
        <View className="h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm dark:border-gray-600 dark:bg-gray-800">
          <Animated.View style={animatedStyle}>
            <Ionicons name="swap-horizontal" size={20} color="#6b7280" />
          </Animated.View>
        </View>
      </Pressable>
      <CurrencyButton currency={toCurrency} onPress={onToPress} />
    </View>
  )
}

function CurrencyButton({ currency, onPress }: { currency: Currency; onPress: () => void }) {
  const { i18n } = useTranslation()

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 flex-row items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
      activeOpacity={0.7}
      accessibilityRole="button">
      <ThemedText color="inherit" className="text-2xl">
        {currency.flag}
      </ThemedText>
      <View className="flex-1">
        <ThemedText variant="label" weight="semibold">
          {currency.code}
        </ThemedText>
        <ThemedText variant="caption" color="muted" numberOfLines={1}>
          {getCurrencyName(currency, i18n.language as Language)}
        </ThemedText>
      </View>
      <Ionicons name="chevron-down" size={16} color="#9ca3af" />
    </TouchableOpacity>
  )
}
