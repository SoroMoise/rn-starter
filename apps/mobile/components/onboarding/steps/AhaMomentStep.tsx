import { ThemedText } from '@/components/ui/ThemedText'
import { CURRENCIES } from '@/constants/currencies'
import { PERSONA_CONTENT } from '@/constants/personaContent'
import type { Persona } from '@/stores/onboardingStore'
import type { Language } from '@/types'
import { getIntlLocale } from '@/utils/date'
import { triggerSelection } from '@/utils/haptics'
import { mockConvert, pickAhaTargets } from '@/utils/onboardingMockConvert'
import { useThemedColor } from '@hooks/useThemedColor'
import Slider from '@react-native-community/slider'
import { LinearGradient } from 'expo-linear-gradient'
import { MotiView } from 'moti'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useWindowDimensions, View } from 'react-native'

const MIN_AMOUNT = 1
const MAX_AMOUNT = 10_000
const INITIAL_AMOUNT = 100
const AUTO_REVEAL_FALLBACK_MS = 1300
const HAPTIC_STEP = 50

const REVEAL_KEYS = ['reveal1', 'reveal2', 'reveal3'] as const
const REVEAL_STAGGER_MS = 110

interface AhaMomentStepProps {
  source: string
  persona: Persona | null
  onInteractionsResolved: (info: { interactions: number; highestAmount: number }) => void
}

interface TargetRow {
  code: string
  flag: string
  symbol: string
}

export function AhaMomentStep({ source, persona, onInteractionsResolved }: AhaMomentStepProps) {
  const { t, i18n } = useTranslation()
  const isDark = useThemedColor()
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()
  const [amount, setAmount] = useState(INITIAL_AMOUNT)
  const [interactions, setInteractions] = useState(0)
  const [highestAmount, setHighestAmount] = useState(INITIAL_AMOUNT)
  const lastHapticPaletRef = useRef(Math.floor(INITIAL_AMOUNT / HAPTIC_STEP))
  const personaKey = persona ?? 'general'
  const defaults = PERSONA_CONTENT[personaKey].aha.defaultTargets
  const targets = useMemo(() => pickAhaTargets(source, defaults), [source, defaults])
  const sourceMeta = CURRENCIES.find((c) => c.code === source)

  const targetRows: TargetRow[] = useMemo(
    () =>
      targets
        .map((code) => CURRENCIES.find((c) => c.code === code))
        .filter((c): c is (typeof CURRENCIES)[number] => Boolean(c))
        .map((c) => ({ code: c.code, flag: c.flag, symbol: c.symbol })),
    [targets]
  )

  useEffect(() => {
    if (interactions >= 3) return
    const timer = setTimeout(() => {
      setInteractions(3)
    }, AUTO_REVEAL_FALLBACK_MS)
    return () => clearTimeout(timer)
  }, [interactions])

  const interactionsRef = useRef(interactions)
  const highestAmountRef = useRef(highestAmount)
  const onInteractionsResolvedRef = useRef(onInteractionsResolved)

  useEffect(() => {
    interactionsRef.current = interactions
  }, [interactions])

  useEffect(() => {
    highestAmountRef.current = highestAmount
  }, [highestAmount])

  useEffect(() => {
    onInteractionsResolvedRef.current = onInteractionsResolved
  }, [onInteractionsResolved])

  useEffect(() => {
    return () => {
      onInteractionsResolvedRef.current({
        interactions: interactionsRef.current,
        highestAmount: highestAmountRef.current,
      })
    }
  }, [])

  const handleValueChange = useCallback((value: number) => {
    const next = Math.round(value)
    setAmount(next)
    setHighestAmount((prev) => Math.max(prev, next))
    const palet = Math.floor(next / HAPTIC_STEP)
    if (palet !== lastHapticPaletRef.current) {
      lastHapticPaletRef.current = palet
      triggerSelection()
    }
    setInteractions((prev) => (prev < 3 ? prev + 1 : prev))
  }, [])

  return (
    <View style={{ width: screenWidth, height: screenHeight }} className="flex-1">
      <LinearGradient
        colors={isDark ? ['#0f0c29', '#302b63', '#24243e'] : ['#f8faff', '#eef2ff', '#f5f3ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />

      <View className="absolute inset-0 justify-center px-6 pt-20">
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 100, damping: 30 }}>
          <ThemedText variant="display" align="center" className="mb-2 text-3xl">
            {t('onboarding.aha.title')}
          </ThemedText>
          <ThemedText variant="body" color="muted" weight="medium" align="center" className="mb-8">
            {t('onboarding.aha.subtitle')}
          </ThemedText>
        </MotiView>

        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', delay: 250, damping: 30 }}>
          <View
            className={`mb-4 self-center rounded-2xl border px-8 py-5 ${isDark ? 'border-white/10 bg-white/10' : 'border-black/[0.05] bg-indigo-500/[0.07]'}`}>
            <ThemedText
              variant="inherit"
              color="default"
              className="text-center text-5xl font-bold">
              {sourceMeta?.symbol ?? ''}{' '}
              {amount.toLocaleString(getIntlLocale(i18n.language as Language))}
            </ThemedText>
            <ThemedText variant="label" color="muted" align="center" className="mt-1">
              {source}
            </ThemedText>
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', delay: 400, duration: 400 }}>
          <Slider
            minimumValue={MIN_AMOUNT}
            maximumValue={MAX_AMOUNT}
            value={INITIAL_AMOUNT}
            onValueChange={handleValueChange}
            minimumTrackTintColor="#60a5fa"
            maximumTrackTintColor={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}
            thumbTintColor="#3b82f6"
            accessibilityLabel={t('a11y.amountSlider', { currency: source })}
          />
          <View className="-mt-1 flex-row justify-between">
            <ThemedText variant="label" color="muted" weight="semibold">
              {sourceMeta?.symbol ?? ''}
              {MIN_AMOUNT}
            </ThemedText>
            <ThemedText variant="label" color="muted" weight="semibold">
              {sourceMeta?.symbol ?? ''}
              {MAX_AMOUNT.toLocaleString(getIntlLocale(i18n.language as Language))}
            </ThemedText>
          </View>
        </MotiView>

        <View className="mt-6 gap-2">
          {targetRows.map((row, index) => (
            <MotiView
              key={row.code}
              from={{ opacity: 0, translateY: 15 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', delay: 550 + index * 150, damping: 25 }}>
              <View
                className={`flex-row items-center justify-between rounded-2xl px-5 py-3 ${isDark ? 'bg-white/10' : 'bg-indigo-500/[0.07]'}`}>
                <View className="flex-row items-center gap-3">
                  <ThemedText color="inherit" className="text-2xl">
                    {row.flag}
                  </ThemedText>
                  <ThemedText variant="heading" weight="semibold">
                    {row.code}
                  </ThemedText>
                </View>
                <ThemedText variant="heading" weight="semibold">
                  {row.symbol}{' '}
                  {mockConvert({ amount, from: source, to: row.code }).toLocaleString(
                    getIntlLocale(i18n.language as Language),
                    { maximumFractionDigits: 2 }
                  )}
                </ThemedText>
              </View>
            </MotiView>
          ))}
        </View>

        <View className="mt-5 gap-1.5">
          {REVEAL_KEYS.map((key, index) => {
            const revealed = interactions >= index + 1
            return (
              <MotiView
                key={key}
                animate={{ opacity: revealed ? 1 : 0, translateY: revealed ? 0 : 10 }}
                transition={{
                  type: 'timing',
                  duration: 420,
                  delay: revealed ? index * REVEAL_STAGGER_MS : 0,
                }}>
                <ThemedText variant="body" color="muted" weight="medium">
                  {t(`onboarding.aha.${key}`)}
                </ThemedText>
              </MotiView>
            )
          })}
        </View>
      </View>
    </View>
  )
}
