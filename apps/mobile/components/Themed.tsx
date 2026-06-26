import { View as DefaultView } from 'react-native'

import Colors, { shadows } from '@/constants/Colors'
import { useColorScheme } from 'nativewind'

export type ViewProps = DefaultView['props']

export function useThemeColor() {
  const { colorScheme } = useColorScheme()
  return Colors[colorScheme ?? 'light']
}

export function useThemeShadow() {
  const { colorScheme } = useColorScheme()
  return shadows(colorScheme === 'dark')
}
