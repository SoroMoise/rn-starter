import { useColorScheme } from 'nativewind'

export function useThemedColor() {
  const { colorScheme } = useColorScheme()
  return colorScheme === 'dark'
}
