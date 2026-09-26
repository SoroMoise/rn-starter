import { ThemedText } from '@/components/ui/ThemedText'
import { useThemedColor } from '@/hooks/useThemedColor'
import { LinearGradient } from 'expo-linear-gradient'
import { Image, StyleSheet, View } from 'react-native'

const heroLight = require('../../assets/images/paywall-illustration-light.webp')
const heroDark = require('../../assets/images/paywall-illustration-dark.webp')

export function PaywallHero({ title, subtitle }: { title: string; subtitle: string }) {
  const isDark = useThemedColor()

  return (
    <View style={styles.container}>
      <Image source={isDark ? heroDark : heroLight} style={styles.image} resizeMode="cover" />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.65)']}
        style={styles.overlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}>
        <ThemedText variant="title" weight="bold" color="inverse" style={styles.title}>
          {title}
        </ThemedText>
        <ThemedText variant="body" color="inherit" style={styles.subtitle}>
          {subtitle}
        </ThemedText>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 400,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
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
  title: {
    fontSize: 22,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.75)',
  },
})
