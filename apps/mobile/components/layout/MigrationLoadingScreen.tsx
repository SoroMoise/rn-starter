import { useThemeColor } from '@/components/Themed'
import { ActivityIndicator, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

export function MigrationLoadingScreen() {
  const colors = useThemeColor()
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.screenBackground }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    </GestureHandlerRootView>
  )
}
