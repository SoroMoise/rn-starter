import { ThemedText } from '@components/ui/ThemedText'
import Ionicons from '@expo/vector-icons/Ionicons'
import { usePremium } from '@hooks/usePremium'
import { useThemedColor } from '@hooks/useThemedColor'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, View } from 'react-native'

type GatedFeature = 'rateAlerts' | 'backup' | 'export'

type PremiumGateProps = {
  feature: GatedFeature
  source: string
  children: React.ReactNode
}

export function PremiumGate({ feature: _feature, source, children }: PremiumGateProps) {
  const { isPremium, isInitialized, openPaywall } = usePremium()
  const isDark = useThemedColor()
  const { t } = useTranslation()

  if (!isInitialized) return null

  if (isPremium) return <>{children}</>

  return (
    <View style={styles.container}>
      {children}
      <Pressable
        style={[styles.overlay, isDark && styles.overlayDark]}
        onPress={() => void openPaywall({ source })}
        accessibilityRole="button"
        accessibilityLabel={t('premiumGate.unlock')}>
        <View style={styles.lockContent}>
          <View style={[styles.lockCircle, isDark && styles.lockCircleDark]}>
            <Ionicons name="lock-closed" size={22} color="#8b5cf6" />
          </View>
          <View style={styles.badge}>
            <ThemedText style={styles.badgeText} color="inherit">
              {t('premiumGate.proBadge')}
            </ThemedText>
          </View>
          <ThemedText variant="body" weight="semibold" style={styles.unlockLabel}>
            {t('premiumGate.unlock')}
          </ThemedText>
        </View>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayDark: {
    backgroundColor: 'rgba(15, 15, 20, 0.88)',
  },
  lockContent: {
    alignItems: 'center',
    gap: 8,
  },
  lockCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockCircleDark: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  badge: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 99,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  unlockLabel: {
    color: '#8b5cf6',
    fontSize: 13,
  },
})
