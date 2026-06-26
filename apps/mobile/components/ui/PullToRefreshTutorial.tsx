import Ionicons from '@expo/vector-icons/Ionicons'
import { MotiView, useAnimationState } from 'moti'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useThemedColor } from '@hooks/useThemedColor'
import { View } from 'react-native'

import { ThemedText } from '@/components/ui/ThemedText'

interface PullToRefreshTutorialProps {
  visible: boolean
}

export function PullToRefreshTutorial({ visible }: PullToRefreshTutorialProps) {
  const { t } = useTranslation()
  const isDark = useThemedColor()

  const arrow1State = useAnimationState({
    from: { translateY: 0 },
    to: { translateY: 10 },
  })

  const arrow2State = useAnimationState({
    from: { translateY: -5, opacity: 0.5 },
    to: { translateY: 5, opacity: 1 },
  })

  const arrow3State = useAnimationState({
    from: { translateY: -10, opacity: 0.3 },
    to: { translateY: 0, opacity: 0.7 },
  })

  useEffect(() => {
    if (visible) {
      const interval1 = setInterval(() => {
        arrow1State.transitionTo('to')
        setTimeout(() => arrow1State.transitionTo('from'), 1000)
      }, 2000)

      const interval2 = setInterval(() => {
        arrow2State.transitionTo('to')
        setTimeout(() => arrow2State.transitionTo('from'), 1000)
      }, 2000)

      const interval3 = setInterval(() => {
        arrow3State.transitionTo('to')
        setTimeout(() => arrow3State.transitionTo('from'), 1000)
      }, 2000)

      setTimeout(() => {
        arrow1State.transitionTo('to')
        setTimeout(() => arrow1State.transitionTo('from'), 1000)
      }, 0)

      setTimeout(() => {
        arrow2State.transitionTo('to')
        setTimeout(() => arrow2State.transitionTo('from'), 1000)
      }, 200)

      setTimeout(() => {
        arrow3State.transitionTo('to')
        setTimeout(() => arrow3State.transitionTo('from'), 1000)
      }, 400)

      return () => {
        clearInterval(interval1)
        clearInterval(interval2)
        clearInterval(interval3)
      }
    }
  }, [visible, arrow1State, arrow2State, arrow3State])

  if (!visible) return null

  return (
    <View className="absolute left-0 right-0 top-48 z-50 items-center px-6">
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{
          type: 'timing',
          duration: 500,
        }}>
        <View className="overflow-hidden rounded-3xl border border-blue-200/50 bg-white/95 shadow-2xl dark:border-blue-500/30 dark:bg-gray-800/95">
          <View className="px-6 py-5">
            <View className="mb-3 items-center">
              <MotiView
                state={arrow1State}
                transition={{
                  type: 'timing',
                  duration: 1000,
                }}>
                <Ionicons name="chevron-down" size={32} color={isDark ? '#60a5fa' : '#3b82f6'} />
              </MotiView>
              <MotiView
                state={arrow2State}
                transition={{
                  type: 'timing',
                  duration: 1000,
                }}
                style={{ marginTop: -16 }}>
                <Ionicons name="chevron-down" size={32} color={isDark ? '#60a5fa' : '#3b82f6'} />
              </MotiView>
              <MotiView
                state={arrow3State}
                transition={{
                  type: 'timing',
                  duration: 1000,
                }}
                style={{ marginTop: -16 }}>
                <Ionicons name="chevron-down" size={32} color={isDark ? '#60a5fa' : '#3b82f6'} />
              </MotiView>
            </View>

            <ThemedText variant="heading" align="center" className="mb-2">
              {t('tutorial.pullToRefresh.title')}
            </ThemedText>
            <ThemedText
              variant="label"
              color="inherit"
              weight="normal"
              align="center"
              className="text-gray-600 dark:text-gray-300">
              {t('tutorial.pullToRefresh.description')}
            </ThemedText>
          </View>
        </View>
      </MotiView>
    </View>
  )
}
