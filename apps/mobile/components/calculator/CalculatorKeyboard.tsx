import { CalculatorButton, triggerCopyHaptic } from '@components/calculator/CalculatorButton'
import { CalculatorDisplay } from '@components/calculator/CalculatorDisplay'
import { useCalculator } from '@hooks/useCalculator'
import { getDecimalSeparator } from '@utils/formatters'
import { triggerHeavy } from '@utils/haptics'
import { setStringAsync } from 'expo-clipboard'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BackHandler, Dimensions, Pressable, StyleSheet, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useThemeShadow } from '../Themed'
import { TAB_BAR_HEIGHT } from '../ui/PremiumTabBar'

const SCREEN_HEIGHT = Dimensions.get('window').height
const MAX_KEYBOARD_HEIGHT = SCREEN_HEIGHT * 0.55

interface CalculatorKeyboardProps {
  visible: boolean
  onClose: () => void
  onResult: (value: string) => void
  initialValue?: string
}

export function CalculatorKeyboard({
  visible,
  onClose,
  onResult,
  initialValue,
}: Readonly<CalculatorKeyboardProps>) {
  const { t, i18n } = useTranslation()
  const decimalSep = getDecimalSeparator(i18n.language)
  const shadows = useThemeShadow()
  const insets = useSafeAreaInsets()
  const [showFlash, setShowFlash] = useState(false)
  const [mounted, setMounted] = useState(false)

  const translateY = useSharedValue(SCREEN_HEIGHT)
  const stretchY = useSharedValue(1)
  const panelHeight = useSharedValue(0)

  const handleResult = useCallback(
    (value: string) => {
      onResult(value)
      setShowFlash(true)
      setTimeout(() => setShowFlash(false), 500)
    },
    [onResult]
  )

  const calculator = useCalculator(handleResult)

  useEffect(() => {
    if (visible) {
      setMounted(true)
      calculator.reset(initialValue)
      translateY.value = withTiming(0, { duration: 400 })
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      })
      const timer = setTimeout(() => setMounted(false), 400)
      return () => clearTimeout(timer)
    }
  }, [visible]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!visible) return
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose()
      return true
    })
    return () => sub.remove()
  }, [visible, onClose])

  const panGesture = Gesture.Pan()
    .activeOffsetY(10)
    .onUpdate((event) => {
      if (event.translationY < 0) {
        const overscroll = -event.translationY
        stretchY.value = 1 + 0.12 * Math.log10(1 + overscroll / 20)
        translateY.value = 0
      } else {
        stretchY.value = 1
        translateY.value = event.translationY
      }
    })
    .onEnd((event) => {
      stretchY.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) })
      if (event.translationY > 100 || event.velocityY > 500) {
        translateY.value = withTiming(
          SCREEN_HEIGHT,
          { duration: 300, easing: Easing.out(Easing.cubic) },
          (finished) => {
            if (finished) runOnJS(onClose)()
          }
        )
      } else {
        translateY.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) })
      }
    })

  const animatedPanelStyle = useAnimatedStyle(() => {
    const bottomAnchorOffset = ((stretchY.value - 1) * panelHeight.value) / 2
    return {
      transform: [
        { translateY: translateY.value - bottomAnchorOffset },
        { scaleY: stretchY.value },
      ],
    }
  })

  const handleClearLongPress = useCallback(() => {
    triggerHeavy()
    calculator.clear()
  }, [calculator])

  const handleCopy = useCallback(async () => {
    await setStringAsync(calculator.result)
    triggerCopyHaptic()
  }, [calculator.result])

  if (!mounted) return null

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: '#00000000' }]}
        pointerEvents="auto">
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View
          onLayout={(e) => {
            panelHeight.value = e.nativeEvent.layout.height
          }}
          style={[
            styles.panel,
            shadows.large,
            animatedPanelStyle,
            { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 20 },
          ]}
          className="bg-white dark:border-t dark:border-gray-700 dark:bg-gray-900">
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          <CalculatorDisplay
            expression={calculator.expression}
            result={calculator.result || calculator.currentNumber || calculator.expression}
            hasError={calculator.hasError}
            onBackspace={calculator.backspace}
            showFlash={showFlash}
            cursorPosition={calculator.cursorPosition}
            onCursorChange={calculator.setCursorPosition}
          />

          <View style={{ maxHeight: MAX_KEYBOARD_HEIGHT }}>
            <View className="flex-row">
              <View className="flex-1 px-1 py-1">
                <CalculatorButton
                  label="C"
                  onPress={calculator.clear}
                  variant="clear"
                  accessibilityLabel={t('calculator.clear')}
                />
              </View>
              <View className="flex-1 px-1 py-1">
                <CalculatorButton
                  label="%"
                  onPress={calculator.applyPercent}
                  variant="function"
                  accessibilityLabel={t('calculator.percent')}
                />
              </View>
              <View className="flex-1 px-1 py-1">
                <CalculatorButton
                  label="⌫"
                  onPress={calculator.backspace}
                  onLongPress={handleClearLongPress}
                  variant="function"
                  accessibilityLabel={t('calculator.backspace')}
                />
              </View>
              <View className="flex-1 px-1 py-1">
                <CalculatorButton
                  label="÷"
                  onPress={() => calculator.appendOperator('\u00F7')}
                  variant="operator"
                  accessibilityLabel={t('calculator.divide')}
                />
              </View>
            </View>

            <View className="flex-row">
              <View className="flex-1 px-1 py-1">
                <CalculatorButton
                  label="7"
                  onPress={() => calculator.appendDigit('7')}
                  variant="digit"
                />
              </View>
              <View className="flex-1 px-1 py-1">
                <CalculatorButton
                  label="8"
                  onPress={() => calculator.appendDigit('8')}
                  variant="digit"
                />
              </View>
              <View className="flex-1 px-1 py-1">
                <CalculatorButton
                  label="9"
                  onPress={() => calculator.appendDigit('9')}
                  variant="digit"
                />
              </View>
              <View className="flex-1 px-1 py-1">
                <CalculatorButton
                  label="×"
                  onPress={() => calculator.appendOperator('\u00D7')}
                  variant="operator"
                  accessibilityLabel={t('calculator.multiply')}
                />
              </View>
            </View>

            <View className="flex-row">
              <View className="flex-1 px-1 py-1">
                <CalculatorButton
                  label="4"
                  onPress={() => calculator.appendDigit('4')}
                  variant="digit"
                />
              </View>
              <View className="flex-1 px-1 py-1">
                <CalculatorButton
                  label="5"
                  onPress={() => calculator.appendDigit('5')}
                  variant="digit"
                />
              </View>
              <View className="flex-1 px-1 py-1">
                <CalculatorButton
                  label="6"
                  onPress={() => calculator.appendDigit('6')}
                  variant="digit"
                />
              </View>
              <View className="flex-1 px-1 py-1">
                <CalculatorButton
                  label="−"
                  onPress={() => calculator.appendOperator('\u2212')}
                  variant="operator"
                  accessibilityLabel={t('calculator.subtract')}
                />
              </View>
            </View>

            <View className="flex-row">
              <View className="flex-1 px-1 py-1">
                <CalculatorButton
                  label="1"
                  onPress={() => calculator.appendDigit('1')}
                  variant="digit"
                />
              </View>
              <View className="flex-1 px-1 py-1">
                <CalculatorButton
                  label="2"
                  onPress={() => calculator.appendDigit('2')}
                  variant="digit"
                />
              </View>
              <View className="flex-1 px-1 py-1">
                <CalculatorButton
                  label="3"
                  onPress={() => calculator.appendDigit('3')}
                  variant="digit"
                />
              </View>
              <View className="flex-1 px-1 py-1">
                <CalculatorButton
                  label="+"
                  onPress={() => calculator.appendOperator('+')}
                  variant="operator"
                  accessibilityLabel={t('calculator.add')}
                />
              </View>
            </View>

            <View className="flex-row">
              <View className="flex-1 px-1 py-1">
                <CalculatorButton
                  label="⧉"
                  onPress={handleCopy}
                  variant="function"
                  accessibilityLabel={t('calculator.copy')}
                />
              </View>
              <View className="flex-1 px-1 py-1">
                <CalculatorButton
                  label="0"
                  onPress={() => calculator.appendDigit('0')}
                  variant="digit"
                />
              </View>
              <View className="flex-1 px-1 py-1">
                <CalculatorButton
                  label={decimalSep}
                  onPress={calculator.appendDecimal}
                  variant="digit"
                  accessibilityLabel={t('calculator.decimal')}
                />
              </View>
              <View className="flex-1 px-1 py-1">
                <CalculatorButton
                  label="="
                  onPress={calculator.evaluate}
                  variant="equals"
                  accessibilityLabel={t('calculator.equals')}
                />
              </View>
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  )
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 16,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9ca3afaa',
  },
})
