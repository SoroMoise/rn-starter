import { setStyle } from 'expo-navigation-bar'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { useThemedColor } from '@hooks/useThemedColor'

interface Props {
  statusStyle?: 'light' | 'dark'
  navigationStyle?: 'light' | 'dark'
}

export function AppSystemBars({ statusStyle, navigationStyle }: Props) {
  const isDark = useThemedColor()

  useEffect(() => {
    setStyle(navigationStyle ?? (isDark ? 'dark' : 'light'))
  }, [isDark, navigationStyle])

  return <StatusBar style={statusStyle ?? (isDark ? 'light' : 'dark')} />
}
