import { ThemedText } from '@/components/ui/ThemedText'
import { RESULT_ANIMATION_VARIANT } from '@/constants/featureFlags'
import React, { useEffect } from 'react'
import { TextInput } from 'react-native'
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)

interface TargetCurrencyResultProps {
  value: number
  formatted: string
  decimals: number
  useSeparator: boolean
  locale: string
  isDark: boolean
}

export function TargetCurrencyResult(props: TargetCurrencyResultProps) {
  return RESULT_ANIMATION_VARIANT === 'countup' ? (
    <CountUpResult {...props} />
  ) : (
    <PopResult {...props} />
  )
}

function PopResult({ formatted }: TargetCurrencyResultProps) {
  const scale = useSharedValue(1)
  const previous = useSharedValue(formatted)

  useEffect(() => {
    if (previous.value !== formatted) {
      previous.value = formatted
      scale.value = withSequence(
        withTiming(1.06, { duration: 120, easing: Easing.out(Easing.cubic) }),
        withSpring(1, { stiffness: 220, damping: 18 })
      )
    }
  }, [formatted, scale, previous])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <Animated.View style={animatedStyle}>
      <ThemedText variant="body" weight="bold" numberOfLines={1} adjustsFontSizeToFit>
        {formatted}
      </ThemedText>
    </Animated.View>
  )
}

interface FormatForCountUpParams {
  value: number
  decimals: number
  useSeparator: boolean
  thousandSep: string
  decimalSep: string
}

function formatForCountUp({
  value,
  decimals,
  useSeparator,
  thousandSep,
  decimalSep,
}: FormatForCountUpParams) {
  'worklet'
  const fixed = value.toFixed(decimals)
  const [intPart, decPart] = fixed.split('.')
  const intWithSep =
    useSeparator && thousandSep ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep) : intPart
  return decPart ? `${intWithSep}${decimalSep}${decPart}` : intWithSep
}

function CountUpResult({
  value,
  decimals,
  useSeparator,
  locale,
  isDark,
}: TargetCurrencyResultProps) {
  const animated = useSharedValue(value)
  const decimalSep = (1.1).toLocaleString(locale).charAt(1)
  const thousandFormatted = (1234).toLocaleString(locale)
  // Pattern is "1<sep>234"; the separator is the char between '1' and '2', or '' if absent
  const thousandSep = thousandFormatted.length > 4 ? thousandFormatted.charAt(1) : ''

  React.useEffect(() => {
    animated.value = withTiming(value, {
      duration: 350,
      easing: Easing.out(Easing.cubic),
    })
  }, [value, animated])

  const animatedProps = useAnimatedProps(() => {
    const text = formatForCountUp({
      value: animated.value,
      decimals,
      useSeparator,
      thousandSep,
      decimalSep,
    })
    return { text, defaultValue: text } as Partial<React.ComponentProps<typeof TextInput>>
  })

  return (
    <AnimatedTextInput
      editable={false}
      underlineColorAndroid="transparent"
      numberOfLines={1}
      animatedProps={animatedProps}
      style={{
        fontSize: 14,
        fontWeight: '700',
        color: isDark ? '#ffffff' : '#111827',
        padding: 0,
        margin: 0,
        textAlign: 'right',
      }}
    />
  )
}
