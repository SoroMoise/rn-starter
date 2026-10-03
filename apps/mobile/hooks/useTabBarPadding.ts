import { tabBarHeight } from '@/components/ui/PremiumTabBar'
import { useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export function useTabBarPadding(extra = 0) {
  const insets = useSafeAreaInsets()
  const { fontScale } = useWindowDimensions()
  return tabBarHeight(fontScale) + insets.bottom + extra
}
