import { ThemedText } from '@/components/ui/ThemedText'
import { useThemedColor } from '@/hooks/useThemedColor'
import { LinearGradient } from 'expo-linear-gradient'
import { Image, StyleSheet, View } from 'react-native'

const heroLight = require('../../assets/images/paywall-illustration-light.webp')
const heroDark = require('../../assets/images/paywall-illustration-dark.webp')

export const PAYWALL_HERO_HEIGHT = 400

export function PaywallHero({
  title,
  subtitle,
  height = PAYWALL_HERO_HEIGHT,
}: {
  title: string
  subtitle: string
  height?: number
}) {
  const isDark = useThemedColor()

  return (
    <View className="overflow-hidden" style={{ height }}>
      <Image source={isDark ? heroDark : heroLight} className="h-full w-full" resizeMode="cover" />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.65)']}
        style={styles.overlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}>
        <ThemedText
          variant="title"
          weight="bold"
          color="inverse"
          align="center"
          className="text-[22px] leading-[29px]">
          {title}
        </ThemedText>
        <ThemedText
          variant="body"
          color="inherit"
          align="center"
          className="text-[15px] leading-[22px] text-white/75">
          {subtitle}
        </ThemedText>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    paddingHorizontal: 15,
    paddingBottom: 16,
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 4,
  },
})
