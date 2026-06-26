import { BackupSectionInner } from '@/components/settings/BackupSection'
import { Section, SectionContent, SectionHeader } from '@/components/settings/SettingsSection'
import { ThemedText } from '@/components/ui/ThemedText'
import { usePremium } from '@/hooks/usePremium'
import { useThemedColor } from '@/hooks/useThemedColor'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, View } from 'react-native'

export function BackupSectionGate() {
  const { isPremium, isInitialized, openPaywall } = usePremium()
  const isDark = useThemedColor()
  const { t } = useTranslation()

  if (!isInitialized) return null

  return (
    <Section>
      <SectionHeader>{t('backup.title')}</SectionHeader>
      <View style={styles.cardWrapper}>
        <SectionContent>
          <BackupSectionInner />
        </SectionContent>
        {!isPremium && (
          <Pressable
            style={[styles.overlay, isDark && styles.overlayDark]}
            onPress={() => void openPaywall({ source: 'settings_backup' })}
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
        )}
      </View>
    </Section>
  )
}

const styles = StyleSheet.create({
  cardWrapper: {
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayDark: {
    backgroundColor: '#0F0F14E0',
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
