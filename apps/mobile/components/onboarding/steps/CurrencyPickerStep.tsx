import { ThemedText } from '@/components/ui/ThemedText'
import { CURRENCIES } from '@/constants/currencies'
import { triggerLight, triggerSelection } from '@/utils/haptics'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useThemedColor } from '@hooks/useThemedColor'
import { LinearGradient } from 'expo-linear-gradient'
import { MotiView } from 'moti'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dimensions, FlatList, Pressable, TextInput, View } from 'react-native'
import Animated, {
  SharedValue,
  interpolateColor,
  useAnimatedKeyboard,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

const POPULAR_CODES = [
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CHF',
  'CAD',
  'AUD',
  'CNY',
  'INR',
  'BRL',
  'KRW',
  'MXN',
  'SGD',
  'HKD',
  'NOK',
  'SEK',
  'TRY',
  'ZAR',
  'THB',
  'XOF',
  'MAD',
  'AED',
  'NZD',
  'PLN',
]

const ANIMATION_DURATION_MS = 180

const CHECKMARK_ICON_SIZE = 22
const CHECKMARK_LEFT_SPACING = 8
const CHECKMARK_CONTAINER_WIDTH = CHECKMARK_ICON_SIZE + CHECKMARK_LEFT_SPACING

const CURRENCY_CODE_TEXT_UNSELECTED = { dark: '#ffffff', light: '#111827' } as const
const CURRENCY_CODE_TEXT_SELECTED = { dark: '#93c5fd', light: '#2563eb' } as const

interface CurrencyPickerStepProps {
  selectedCurrency: string
  onSelectCurrency: (code: string) => void
}

export function CurrencyPickerStep({
  selectedCurrency,
  onSelectCurrency,
}: CurrencyPickerStepProps) {
  const { t, i18n } = useTranslation()
  const isDark = useThemedColor()
  const [searchQuery, setSearchQuery] = useState('')
  const [showAllCurrencies, setShowAllCurrencies] = useState(false)
  const selectedCodeShared = useSharedValue(selectedCurrency)

  useEffect(() => {
    selectedCodeShared.value = selectedCurrency
  }, [selectedCurrency, selectedCodeShared])

  const keyboard = useAnimatedKeyboard()
  const listShiftStyle = useAnimatedStyle(() => ({
    paddingBottom: keyboard.height.value - 80,
  }))

  const language = i18n.language

  // Capture the device-detected currency once (initial prop value).
  // We must NOT reorder the grid when the user selects a different currency.
  const deviceCurrencyCode = useRef(selectedCurrency).current

  const popularCurrencies = useMemo(() => {
    const popular = POPULAR_CODES.map((code) => CURRENCIES.find((c) => c.code === code)).filter(
      Boolean
    ) as typeof CURRENCIES

    const deviceCurrency = CURRENCIES.find((c) => c.code === deviceCurrencyCode)
    if (!deviceCurrency) return popular

    const isInPopular = POPULAR_CODES.includes(deviceCurrencyCode)
    const rest = popular.filter((c) => c.code !== deviceCurrencyCode)
    return [deviceCurrency, ...(isInPopular ? rest : rest.slice(0, -1))]
  }, [deviceCurrencyCode])

  const allCurrencies = useMemo(() => {
    if (!searchQuery.trim()) return CURRENCIES
    const q = searchQuery.toLowerCase()
    return CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.localizedNames[language as keyof typeof c.localizedNames]?.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
    )
  }, [searchQuery, language])

  const handleSelect = useCallback(
    (code: string) => {
      triggerSelection()
      onSelectCurrency(code)
    },
    [onSelectCurrency]
  )

  const displayCurrencies = showAllCurrencies ? allCurrencies : popularCurrencies

  return (
    <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }} className="flex-1">
      <LinearGradient
        colors={isDark ? ['#0f0c29', '#302b63', '#24243e'] : ['#f8faff', '#eef2ff', '#f5f3ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />

      <View className="absolute inset-0 px-5 pt-24">
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 200, damping: 30 }}>
          <ThemedText variant="display" align="center" className="mb-2 text-3xl">
            {t('onboarding.currencyPicker.title')}
          </ThemedText>
          <ThemedText variant="body" color="muted" weight="medium" align="center" className="mb-6">
            {t('onboarding.currencyPicker.subtitle')}
          </ThemedText>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 400, damping: 30 }}>
          <View
            className={`mb-2 flex-row items-center rounded-2xl px-4 py-1 ${isDark ? 'bg-white/10' : 'bg-black/[0.04]'}`}>
            <Ionicons
              name="search"
              size={20}
              color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'}
            />
            <TextInput
              className={`ml-3 flex-1 text-base ${isDark ? 'text-white' : 'text-gray-900'}`}
              placeholder={t('onboarding.currencyPicker.searchPlaceholder')}
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text)
                if (text.length > 0 && !showAllCurrencies) {
                  setShowAllCurrencies(true)
                }
              }}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'}
                />
              </Pressable>
            )}
          </View>
        </MotiView>

        {!showAllCurrencies && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', delay: 500, duration: 400 }}
            className="mb-1 flex-row items-center justify-between">
            <MotiView
              animate={{ opacity: selectedCurrency === deviceCurrencyCode ? 1 : 0 }}
              transition={{ type: 'timing', duration: 220 }}
              pointerEvents="none"
              className="flex-row items-center gap-1.5">
              <Ionicons
                name="information-circle-outline"
                size={14}
                color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)'}
              />
              <ThemedText variant="caption" color="subtle" weight="normal">
                {t('onboarding.currencyPicker.detectedHint')}
              </ThemedText>
            </MotiView>
            <Pressable
              onPress={() => {
                triggerLight()
                setShowAllCurrencies(true)
              }}
              className="rounded px-3 py-1.5">
              <ThemedText variant="label" color="inherit" className="text-blue-400">
                {t('onboarding.currencyPicker.showAll')}
              </ThemedText>
            </Pressable>
          </MotiView>
        )}

        <Animated.View className="flex-1" style={listShiftStyle}>
          <FlatList
            data={displayCurrencies}
            keyExtractor={(item) => item.code}
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            numColumns={showAllCurrencies ? 1 : 3}
            key={showAllCurrencies ? 'list' : 'grid'}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item, index }) =>
              showAllCurrencies ? (
                <CurrencyListItem
                  currency={item}
                  isSelected={selectedCurrency === item.code}
                  onSelect={handleSelect}
                  language={language}
                  isDark={isDark}
                  selectedCodeShared={selectedCodeShared}
                />
              ) : (
                <CurrencyGridItem
                  currency={item}
                  isSelected={selectedCurrency === item.code}
                  onSelect={handleSelect}
                  index={index}
                  isDark={isDark}
                />
              )
            }
          />
        </Animated.View>
      </View>
    </View>
  )
}

interface CurrencyGridItemProps {
  currency: (typeof CURRENCIES)[0]
  isSelected: boolean
  onSelect: (code: string) => void
  index: number
  isDark: boolean
}

function CurrencyGridItem({
  currency,
  isSelected,
  onSelect,
  index,
  isDark,
}: CurrencyGridItemProps) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = () => {
    scale.value = withTiming(0.92, { duration: ANIMATION_DURATION_MS })
  }

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: ANIMATION_DURATION_MS })
  }

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: 'spring',
        delay: 500 + index * 40,
        damping: 35,
      }}
      className="w-1/3 p-1">
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onSelect(currency.code)}>
        <Animated.View
          style={animatedStyle}
          className={`items-center rounded-2xl border-2 py-2 ${
            isSelected
              ? 'border-blue-400 bg-blue-500/30'
              : isDark
                ? 'border-[#ffffff00] bg-white/10'
                : 'border-[#00000000] bg-black/[0.04]'
          }`}>
          <ThemedText color="inherit" className="text-2xl">
            {currency.flag}
          </ThemedText>
          <ThemedText
            variant="label"
            weight="bold"
            color="inherit"
            className={`mt-1.5 ${
              isSelected
                ? isDark
                  ? 'text-blue-300'
                  : 'text-blue-600'
                : isDark
                  ? 'text-white'
                  : 'text-gray-900'
            }`}>
            {currency.code}
          </ThemedText>
          <ThemedText variant="caption" color="muted" className="mt-0.5">
            {currency.symbol}
          </ThemedText>
        </Animated.View>
      </Pressable>
    </MotiView>
  )
}

interface CurrencyListItemProps {
  currency: (typeof CURRENCIES)[0]
  isSelected: boolean
  onSelect: (code: string) => void
  language: string
  isDark: boolean
  selectedCodeShared: SharedValue<string>
}

function CurrencyListItem({
  currency,
  isSelected,
  onSelect,
  language,
  isDark,
  selectedCodeShared,
}: CurrencyListItemProps) {
  const name =
    currency.localizedNames[language as keyof typeof currency.localizedNames] || currency.name

  const scale = useSharedValue(1)
  const checkmarkProgress = useSharedValue(isSelected ? 1 : 0)
  const currencyCode = currency.code

  useAnimatedReaction(
    () => selectedCodeShared.value,
    (currentCode) => {
      checkmarkProgress.value = withTiming(currentCode === currencyCode ? 1 : 0, { duration: 180 })
    }
  )

  const rowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolateColor(
      checkmarkProgress.value,
      [0, 1],
      [isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', 'rgba(59,130,246,0.3)']
    ),
    borderColor: interpolateColor(checkmarkProgress.value, [0, 1], ['transparent', '#60a5fa']),
  }))

  const checkmarkAnimatedStyle = useAnimatedStyle(() => ({
    width: checkmarkProgress.value * CHECKMARK_CONTAINER_WIDTH,
    opacity: checkmarkProgress.value,
  }))

  const currencyCodeAnimatedStyle = useAnimatedStyle(() => {
    const unselected = isDark
      ? CURRENCY_CODE_TEXT_UNSELECTED.dark
      : CURRENCY_CODE_TEXT_UNSELECTED.light
    const selected = isDark ? CURRENCY_CODE_TEXT_SELECTED.dark : CURRENCY_CODE_TEXT_SELECTED.light
    return {
      color: interpolateColor(checkmarkProgress.value, [0, 1], [unselected, selected]),
    }
  }, [isDark])

  const handlePressIn = () => {
    scale.value = withTiming(0.96, { duration: ANIMATION_DURATION_MS })
  }

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: ANIMATION_DURATION_MS })
  }

  const handleSelect = () => {
    selectedCodeShared.value = currency.code
    onSelect(currency.code)
  }

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handleSelect}>
      <Animated.View
        style={rowAnimatedStyle}
        className="mb-1 flex-row items-center rounded-xl border px-4 py-3">
        <ThemedText color="inherit" className="mr-3 text-2xl">
          {currency.flag}
        </ThemedText>
        <View className="flex-1">
          <Animated.Text className="text-base font-semibold" style={currencyCodeAnimatedStyle}>
            {currency.code}
          </Animated.Text>
          <ThemedText
            variant="caption"
            color="inherit"
            className={isDark ? 'text-white/70' : 'text-gray-700'}
            numberOfLines={1}>
            {name}
          </ThemedText>
        </View>
        <ThemedText
          variant="label"
          color="inherit"
          weight="normal"
          className={isDark ? 'text-white/70' : 'text-gray-700'}>
          {currency.symbol}
        </ThemedText>
        <Animated.View
          style={[
            checkmarkAnimatedStyle,
            { overflow: 'hidden', height: CHECKMARK_ICON_SIZE, justifyContent: 'center' },
          ]}
          pointerEvents="none">
          <Ionicons
            name="checkmark-circle"
            size={CHECKMARK_ICON_SIZE}
            color="#60a5fa"
            style={{ marginLeft: CHECKMARK_LEFT_SPACING }}
          />
        </Animated.View>
      </Animated.View>
    </Pressable>
  )
}
