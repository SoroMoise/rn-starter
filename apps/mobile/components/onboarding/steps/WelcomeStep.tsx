import { ThemedText } from '@/components/ui/ThemedText'
import { useThemedColor } from '@hooks/useThemedColor'
import { LinearGradient } from 'expo-linear-gradient'
import { MotiView } from 'moti'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useWindowDimensions, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

const FLOATING_CURRENCIES = [
  { symbol: '$', x: 15, y: 12, size: 32, duration: 4500, delay: 0 },
  { symbol: '€', x: 75, y: 8, size: 28, duration: 5200, delay: 300 },
  { symbol: '¥', x: 85, y: 25, size: 24, duration: 3800, delay: 600 },
  { symbol: '£', x: 10, y: 35, size: 26, duration: 4800, delay: 200 },
  { symbol: '₩', x: 65, y: 38, size: 22, duration: 5500, delay: 800 },
  { symbol: '₹', x: 30, y: 18, size: 20, duration: 4200, delay: 500 },
  { symbol: 'Fr', x: 50, y: 10, size: 22, duration: 4000, delay: 400 },
  { symbol: '₿', x: 88, y: 42, size: 18, duration: 5800, delay: 700 },
  { symbol: 'R$', x: 20, y: 48, size: 20, duration: 4600, delay: 900 },
  { symbol: '฿', x: 55, y: 30, size: 18, duration: 5000, delay: 1000 },
]

export function WelcomeStep() {
  const { t } = useTranslation()
  const isDark = useThemedColor()
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()

  return (
    <View style={{ width: screenWidth, height: screenHeight }} className="flex-1">
      <LinearGradient
        colors={isDark ? ['#0f0c29', '#302b63', '#24243e'] : ['#f8faff', '#eef2ff', '#f5f3ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />

      {FLOATING_CURRENCIES.map((currency, index) => (
        <FloatingSymbol key={index} {...currency} isDark={isDark} />
      ))}

      <View className="absolute inset-0 items-center justify-center px-8">
        <MotiView
          from={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', delay: 70, damping: 15, stiffness: 80 }}>
          <View
            className={`mb-6 h-28 w-28 items-center justify-center self-center rounded-[32px] ${isDark ? 'bg-white/10' : 'bg-indigo-500/10'}`}>
            <ThemedText variant="inherit" color="inherit" className="py-4 text-6xl">
              💱
            </ThemedText>
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 300, damping: 45 }}>
          <ThemedText variant="display" align="center" className="mb-2">
            {t('common.appName')}
          </ThemedText>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 500, damping: 45 }}>
          <ThemedText
            variant="heading"
            color="muted"
            weight="medium"
            align="center"
            className="leading-7">
            {t('onboarding.welcome.subtitle')}
          </ThemedText>
        </MotiView>

        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', delay: 800, duration: 800 }}
          className="mt-10">
          <View className="flex-row items-center justify-center gap-3">
            {['🇺🇸', '🇪🇺', '🇬🇧', '🇯🇵', '🇨🇭'].map((flag, i) => (
              <MotiView
                key={i}
                from={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', delay: 800 + i * 100, damping: 30 }}>
                <ThemedText variant="title" color="inherit">
                  {flag}
                </ThemedText>
              </MotiView>
            ))}
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ type: 'timing', delay: 1200, duration: 400 }}>
              <ThemedText variant="heading" color="muted" weight="semibold">
                +170
              </ThemedText>
            </MotiView>
          </View>
        </MotiView>
      </View>
    </View>
  )
}

interface FloatingSymbolProps {
  symbol: string
  x: number
  y: number
  size: number
  duration: number
  delay: number
  isDark: boolean
}

function FloatingSymbol({ symbol, x, y, size, duration, delay, isDark }: FloatingSymbolProps) {
  const translateY = useSharedValue(0)
  const opacity = useSharedValue(0)

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(0.12, { duration: 1000 }))

    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-20, { duration, easing: Easing.inOut(Easing.ease) }),
          withTiming(20, { duration, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    )
  }, [delay, duration, opacity, translateY])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }))

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
        },
      ]}>
      <ThemedText
        color="inherit"
        style={{
          fontSize: size,
          color: isDark ? '#E0E0E0' : '#35364E',
        }}>
        {symbol}
      </ThemedText>
    </Animated.View>
  )
}
