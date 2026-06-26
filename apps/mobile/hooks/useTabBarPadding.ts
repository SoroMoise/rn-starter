import { TAB_BAR_HEIGHT } from '@/components/ui/PremiumTabBar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export function useTabBarPadding(extra = 0) {
  const insets = useSafeAreaInsets()
  return TAB_BAR_HEIGHT + insets.bottom + extra
}
