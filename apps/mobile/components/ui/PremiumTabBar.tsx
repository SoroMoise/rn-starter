import { useThemeColor } from '@/components/Themed'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useThemedColor } from '@hooks/useThemedColor'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { BlurView } from 'expo-blur'
import { triggerLight } from '@utils/haptics'
import { ComponentProps, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, View } from 'react-native'

import { ThemedText } from '@/components/ui/ThemedText'
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

const SPRING_CONFIG = {
  damping: 18,
  stiffness: 200,
  mass: 0.8,
}

type IconName = ComponentProps<typeof Ionicons>['name']

const TAB_CONFIG: Record<string, { focused: IconName; unfocused: IconName; labelKey: string }> = {
  index: {
    focused: 'swap-horizontal',
    unfocused: 'swap-horizontal-outline',
    labelKey: 'tabs.converter',
  },
  statistics: {
    focused: 'stats-chart',
    unfocused: 'stats-chart-outline',
    labelKey: 'tabs.statistics',
  },
  settings: {
    focused: 'settings',
    unfocused: 'settings-outline',
    labelKey: 'tabs.settings',
  },
}

function TabItem({
  routeName,
  isFocused,
  onPress,
  onLongPress,
  colors,
}: {
  routeName: string
  isFocused: boolean
  onPress: () => void
  onLongPress: () => void
  colors: ReturnType<typeof useThemeColor>
}) {
  const { t } = useTranslation()
  const scale = useSharedValue(1)
  const config = TAB_CONFIG[routeName]

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.9, { damping: 20, stiffness: 300 })
  }, [scale])

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_CONFIG)
  }, [scale])

  const handlePress = useCallback(() => {
    triggerLight()
    onPress()
  }, [onPress])

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  if (!config) return null

  const iconName = isFocused ? config.focused : config.unfocused
  const iconColor = isFocused ? colors.tabIconFocused : colors.tabIcon
  const labelColor = isFocused ? colors.tabTextFocused : colors.tabText

  return (
    <AnimatedPressable
      style={[styles.tabItem, containerStyle]}
      onPress={handlePress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}>
      {isFocused && (
        <Animated.View
          entering={FadeIn.duration(250)}
          style={[styles.activeIndicator, { backgroundColor: colors.primaryMuted }]}
        />
      )}

      <Ionicons name={iconName} size={22} color={iconColor} />

      <ThemedText
        color="inherit"
        style={[
          styles.label,
          {
            color: labelColor,
            fontWeight: isFocused ? '600' : '500',
          },
        ]}
        numberOfLines={1}>
        {t(config.labelKey)}
      </ThemedText>
    </AnimatedPressable>
  )
}

function TabBarContent({
  state,
  navigation,
  colors,
  bottomInset,
}: {
  state: BottomTabBarProps['state']
  navigation: BottomTabBarProps['navigation']
  colors: ReturnType<typeof useThemeColor>
  bottomInset: number
}) {
  return (
    <>
      <View style={[styles.accentLine, { backgroundColor: '#ffffff08' }]} />
      <View style={[styles.tabsRow, { paddingBottom: Math.max(bottomInset, 8) }]}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            })

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params)
            }
          }

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            })
          }

          return (
            <TabItem
              key={route.key}
              routeName={route.name}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
              colors={colors}
            />
          )
        })}
      </View>
    </>
  )
}

export function PremiumTabBar({ state, navigation }: BottomTabBarProps) {
  const colors = useThemeColor()
  const isDark = useThemedColor()
  const insets = useSafeAreaInsets()

  const content = (
    <TabBarContent
      state={state}
      navigation={navigation}
      colors={colors}
      bottomInset={insets.bottom}
    />
  )

  return (
    <View style={styles.wrapper}>
      <BlurView
        intensity={85}
        blurReductionFactor={30}
        tint={isDark ? 'dark' : 'light'}
        experimentalBlurMethod="dimezisBlurView"
        style={[styles.container, { borderTopColor: colors.tabBarBorder }]}>
        {content}
      </BlurView>
    </View>
  )
}

export const TAB_BAR_HEIGHT = 64

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  accentLine: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 16,
    position: 'relative',
    gap: 4,
  },
  activeIndicator: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    left: 8,
    right: 8,
    borderRadius: 14,
  },
  label: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
})
