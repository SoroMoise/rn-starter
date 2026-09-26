import { setStyle } from 'expo-navigation-bar'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { useThemedColor } from '@hooks/useThemedColor'

type BarStyle = 'light' | 'dark'

interface Props {
  statusStyle?: BarStyle
  navigationStyle?: BarStyle
}

// The status bar keeps a stack of its mounted props; expo-navigation-bar's `setStyle` is one global
// value. Forced styles are stacked here the same way: the last one mounted wins, and when none is
// left the theme's style comes back.
const forcedNavigationStyles: { style: BarStyle }[] = []
let themeNavigationStyle: BarStyle = 'light'

function applyNavigationStyle() {
  setStyle(forcedNavigationStyles[forcedNavigationStyles.length - 1]?.style ?? themeNavigationStyle)
}

export function AppSystemBars({ statusStyle, navigationStyle }: Props) {
  const isDark = useThemedColor()

  useEffect(() => {
    themeNavigationStyle = isDark ? 'dark' : 'light'
    if (!navigationStyle) {
      applyNavigationStyle()
      return
    }

    const entry = { style: navigationStyle }
    forcedNavigationStyles.push(entry)
    applyNavigationStyle()

    return () => {
      forcedNavigationStyles.splice(forcedNavigationStyles.indexOf(entry), 1)
      applyNavigationStyle()
    }
  }, [isDark, navigationStyle])

  return <StatusBar style={statusStyle ?? (isDark ? 'light' : 'dark')} />
}
