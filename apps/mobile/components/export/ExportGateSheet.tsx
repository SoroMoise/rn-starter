import { GradientButton } from '@/components/ui/GradientButton'
import { ModalBottomSheet } from '@/components/ui/ModalBottomSheet'
import { ThemedText } from '@/components/ui/ThemedText'
import Ionicons from '@expo/vector-icons/Ionicons'
import { usePremium } from '@hooks/usePremium'
import { useThemedColor } from '@hooks/useThemedColor'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export type GateFeatureKey = 'conversion' | 'allRates' | 'historical'

type ExportGateSheetProps = {
  visible: boolean
  onClose: () => void
  featureKey: GateFeatureKey
}

const GATE_CONFIG: Record<GateFeatureKey, { titleKey: string; subtitleKey: string }> = {
  conversion: {
    titleKey: 'export.gateConversionTitle',
    subtitleKey: 'export.gateConversionSubtitle',
  },
  allRates: {
    titleKey: 'export.gateAllRatesTitle',
    subtitleKey: 'export.gateAllRatesSubtitle',
  },
  historical: {
    titleKey: 'export.gateHistoricalTitle',
    subtitleKey: 'export.gateHistoricalSubtitle',
  },
}

const FORMAT_PREVIEW: {
  Icon: (props: { size: number; color: string }) => React.ReactElement
  label: string
  descriptionKey: string
}[] = [
  {
    Icon: ({ size, color }) => <Ionicons name="document-outline" size={size} color={color} />,
    label: 'CSV',
    descriptionKey: 'export.formatCSVDescription',
  },
  {
    Icon: ({ size, color }) => <Ionicons name="document-text-outline" size={size} color={color} />,
    label: 'PDF',
    descriptionKey: 'export.formatPDFDescription',
  },
]

export function ExportGateSheet({ visible, onClose, featureKey }: ExportGateSheetProps) {
  const { t } = useTranslation()
  const isDark = useThemedColor()
  const insets = useSafeAreaInsets()
  const { openPaywall } = usePremium()
  const config = GATE_CONFIG[featureKey]

  return (
    <ModalBottomSheet
      visible={visible}
      onClose={onClose}
      title={t(config.titleKey)}
      subtitle={t(config.subtitleKey)}
      compact>
      <View style={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.formatsSection}>
          {FORMAT_PREVIEW.map(({ Icon, label, descriptionKey }) => (
            <View
              key={label}
              style={[styles.formatCard, isDark ? styles.formatCardDark : styles.formatCardLight]}>
              <View style={[styles.formatIcon, isDark && styles.formatIconDark]}>
                <Icon size={22} color={isDark ? '#9ca3af' : '#6b7280'} />
              </View>
              <View style={styles.formatText}>
                <ThemedText variant="body" weight="semibold">
                  {label}
                </ThemedText>
                <ThemedText variant="label" color="muted" weight="normal">
                  {t(descriptionKey)}
                </ThemedText>
              </View>
              <Ionicons name="lock-closed" size={16} color={isDark ? '#4b5563' : '#9ca3af'} />
            </View>
          ))}
        </View>

        <GradientButton
          onPress={() => {
            onClose()
            void openPaywall({ source: `export_gate_${featureKey}` })
          }}
          colors={['#7c3aed', '#6d28d9']}
          style={{ borderRadius: 9 }}
          gradientStyle={styles.ctaGradient}
          accessibilityLabel={t('export.gateUnlockCTA')}>
          <Ionicons name="star" size={17} color="#ffffff" />
          <ThemedText color="inherit" style={styles.ctaText}>
            {t('export.gateUnlockCTA')}
          </ThemedText>
        </GradientButton>
      </View>
    </ModalBottomSheet>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  formatsSection: {
    gap: 5,
    marginBottom: 20,
  },
  formatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    opacity: 0.45,
  },
  formatCardLight: {
    backgroundColor: '#fafafa',
    borderColor: '#e5e7ebaa',
  },
  formatCardDark: {
    backgroundColor: '#111827',
    borderColor: '#2D2D44',
  },
  formatIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatIconDark: {
    backgroundColor: '#374151',
  },
  formatText: {
    flex: 1,
    gap: 2,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    minHeight: 54,
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
})
