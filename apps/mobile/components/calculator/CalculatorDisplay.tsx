import { useSettingsStore } from '@/stores/settingsStore'
import { formatExpressionForDisplay, formatExpressionWithCursorMap } from '@/utils/formatters'
import { triggerCopyHaptic } from '@components/calculator/CalculatorButton'
import { useThemedColor } from '@hooks/useThemedColor'
import { setStringAsync } from 'expo-clipboard'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { TextInput, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)

interface CalculatorDisplayProps {
  expression: string
  result: string
  hasError: boolean
  onBackspace: () => void
  showFlash?: boolean
  cursorPosition: number
  onCursorChange: (rawPosition: number) => void
}

export function CalculatorDisplay({
  expression,
  result,
  hasError,
  onBackspace,
  showFlash,
  cursorPosition,
  onCursorChange,
}: Readonly<CalculatorDisplayProps>) {
  const { t, i18n } = useTranslation()
  const isDark = useThemedColor()
  const thousandSeparator = useSettingsStore((s) => s.settings.thousandSeparator)
  const locale = i18n.language
  const inputRef = useRef<TextInput>(null)

  const flashProgress = useSharedValue(0)

  useEffect(() => {
    if (showFlash) {
      flashProgress.value = withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0, { duration: 3000 })
      )
    }
  }, [showFlash, flashProgress])

  const normalTextColor = isDark ? '#f3f4f6' : '#111827'
  const greenColor = '#34d399'

  const animatedResultStyle = useAnimatedStyle(() => {
    if (hasError) {
      return { color: '#ef4444' }
    }
    return {
      color: interpolateColor(flashProgress.value, [0, 1], [normalTextColor, greenColor]),
    }
  })

  const swipeGesture = Gesture.Pan()
    .activeOffsetX(-30)
    .onEnd((event) => {
      if (event.translationX < -50) {
        onBackspace()
      }
    })
    .runOnJS(true)

  const longPressGesture = Gesture.LongPress()
    .minDuration(400)
    .onStart(() => {
      if (hasError || result === '0') return
      setStringAsync(result).then(() => triggerCopyHaptic())
    })
    .runOnJS(true)

  const composedGesture = Gesture.Race(swipeGesture, longPressGesture)

  const displayOptions = { locale, useSeparator: thousandSeparator }

  const cursorMap = formatExpressionWithCursorMap(expression, displayOptions)
  const formattedExpression = cursorMap.formatted
  const fmtCursor = cursorMap.rawToFmt[cursorPosition] ?? formattedExpression.length

  const displayResult = hasError
    ? t('common.error')
    : formatExpressionForDisplay(result, displayOptions)

  const showExpression = expression !== result && !hasError

  const handleSelectionChange = (e: { nativeEvent: { selection: { start: number } } }) => {
    const fmtPos = e.nativeEvent.selection.start
    const rawPos = cursorMap.fmtToRaw[fmtPos] ?? expression.length
    onCursorChange(rawPos)
  }

  return (
    <GestureDetector gesture={composedGesture}>
      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={
          showExpression ? `${formattedExpression} = ${displayResult}` : displayResult
        }
        accessibilityHint={t('calculator.displayHint')}
        className="px-6 pb-3 pt-1">
        <View className="items-end">
          <AnimatedTextInput
            ref={inputRef}
            value={formattedExpression}
            selection={{ start: fmtCursor, end: fmtCursor }}
            onSelectionChange={handleSelectionChange}
            editable
            showSoftInputOnFocus={false}
            contextMenuHidden
            autoCorrect={false}
            autoComplete="off"
            caretHidden={false}
            cursorColor={isDark ? '#9ca3af' : '#6b7280'}
            numberOfLines={1}
            underlineColorAndroid="transparent"
            style={[
              {
                textAlign: 'right',
                alignSelf: 'stretch',
                padding: 0,
                margin: 0,
              },
              showExpression
                ? {
                    fontSize: 14,
                    color: isDark ? '#6b7280' : '#9ca3af',
                  }
                : {
                    fontSize: 36,
                    fontWeight: 'bold',
                  },
              !showExpression && animatedResultStyle,
            ]}
          />

          {showExpression && (
            <Animated.Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
              style={[
                {
                  fontSize: 36,
                  fontWeight: 'bold',
                  textAlign: 'right',
                },
                animatedResultStyle,
              ]}>
              {displayResult}
            </Animated.Text>
          )}
        </View>
      </View>
    </GestureDetector>
  )
}
