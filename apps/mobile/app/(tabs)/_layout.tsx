import { useThemeColor } from '@/components/Themed'
import { PremiumTabBar } from '@/components/ui/PremiumTabBar'
import { Tabs } from 'expo-router'

export default function TabLayout() {
  const colors = useThemeColor()

  return (
    <Tabs
      tabBar={(props) => <PremiumTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.screenBackground },
      }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="settings" options={{ lazy: true }} />
    </Tabs>
  )
}
