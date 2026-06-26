import { ModalBottomSheet } from '@/components/ui/ModalBottomSheet'
import { ThemedText } from '@/components/ui/ThemedText'
import { GradientButton } from '@/components/ui/GradientButton'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useThemedColor } from '@hooks/useThemedColor'
import type { ExportFormat, ExportType } from '@stores/exportPreferencesStore'
import { useExportPreferencesStore } from '@stores/exportPreferencesStore'
import { useShallow } from 'zustand/react/shallow'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type ExportBottomSheetProps = {
  visible: boolean
  onClose: () => void
  exportType: ExportType
  title: string
  subtitle: string
  onExport: (params: { format: ExportFormat }) => void
}

const FORMAT_OPTIONS: {
  format: ExportFormat
  Icon: (props: { size: number; color: string }) => React.ReactElement
  descriptionKey: string
}[] = [
  {
    format: 'csv',
    Icon: ({ size, color }) => <Ionicons name="document-outline" size={size} color={color} />,
    descriptionKey: 'export.formatCSVDescription',
  },
  {
    format: 'pdf',
    Icon: ({ size, color }) => <Ionicons name="document-text-outline" size={size} color={color} />,
    descriptionKey: 'export.formatPDFDescription',
  },
]

export function ExportBottomSheet({
  visible,
  onClose,
  exportType,
  title,
  subtitle,
  onExport,
}: ExportBottomSheetProps) {
  const { t } = useTranslation()
  const isDark = useThemedColor()
  const insets = useSafeAreaInsets()
  const { getPreference, setPreference, getLastUsed, setLastUsed } = useExportPreferencesStore(
    useShallow((s) => ({
      getPreference: s.getPreference,
      setPreference: s.setPreference,
      getLastUsed: s.getLastUsed,
      setLastUsed: s.setLastUsed,
    }))
  )

  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf')
  const [rememberChoice, setRememberChoice] = useState(false)

  useEffect(() => {
    if (visible) {
      const remembered = getPreference({ type: exportType })
      const lastUsed = getLastUsed({ type: exportType })
      setSelectedFormat(remembered ?? lastUsed ?? 'pdf')
      setRememberChoice(false)
    }
  }, [visible, exportType, getPreference, getLastUsed])

  const typeLabel = t(
    `export.rememberType${exportType.charAt(0).toUpperCase() + exportType.slice(1)}`
  )

  const handleConfirm = async () => {
    await setLastUsed({ type: exportType, format: selectedFormat })
    if (rememberChoice) {
      await setPreference({ type: exportType, format: selectedFormat })
    }
    onExport({ format: selectedFormat })
    onClose()
  }

  return (
    <ModalBottomSheet visible={visible} onClose={onClose} title={title} subtitle={subtitle} compact>
      <View style={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.optionsSection}>
          {FORMAT_OPTIONS.map(({ format, Icon, descriptionKey }) => {
            const isSelected = selectedFormat === format
            return (
              <Pressable
                key={format}
                style={[
                  styles.optionCard,
                  isDark ? styles.optionCardDark : styles.optionCardLight,
                  isSelected && styles.optionCardSelected,
                  isSelected && isDark && styles.optionCardSelectedDark,
                ]}
                onPress={() => setSelectedFormat(format)}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}>
                <View
                  style={[
                    styles.optionIcon,
                    isDark && styles.optionIconDark,
                    isSelected && styles.optionIconSelected,
                  ]}>
                  <Icon size={22} color={isSelected ? '#7c3aed' : isDark ? '#9ca3af' : '#6b7280'} />
                </View>
                <View style={styles.optionText}>
                  <ThemedText variant="body" weight="semibold">
                    {format.toUpperCase()}
                  </ThemedText>
                  <ThemedText variant="label" color="muted" weight="normal">
                    {t(descriptionKey)}
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.radio,
                    isDark && styles.radioDark,
                    isSelected && styles.radioSelected,
                  ]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </Pressable>
            )
          })}
        </View>

        <Pressable
          style={[styles.rememberRow, isDark && styles.rememberRowDark]}
          onPress={() => setRememberChoice((v) => !v)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: rememberChoice }}>
          <View
            style={[
              styles.checkbox,
              isDark && styles.checkboxDark,
              rememberChoice && styles.checkboxChecked,
            ]}>
            {rememberChoice && <Ionicons name="checkmark" size={15} color="#ffffff" />}
          </View>
          <View style={styles.rememberText}>
            <ThemedText variant="body" weight="semibold" style={styles.rememberLabel}>
              {t('export.rememberChoice')}
            </ThemedText>
            <ThemedText variant="caption" color="muted">
              {t('export.rememberChoiceHint', { type: typeLabel })}
            </ThemedText>
          </View>
        </Pressable>

        <GradientButton
          onPress={() => void handleConfirm()}
          colors={['#7c3aed', '#6d28d9']}
          gradientStyle={styles.ctaGradient}
          style={{ borderRadius: 9 }}>
          <Ionicons name="download-outline" size={18} color="#ffffff" style={styles.ctaIcon} />
          <ThemedText color="inherit" style={styles.ctaText}>
            {t('export.exportButton', { format: selectedFormat.toUpperCase() })}
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
  optionsSection: {
    gap: 5,
    marginBottom: 14,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  optionCardLight: {
    backgroundColor: '#fafafa',
    borderColor: '#e5e7ebaa',
  },
  optionCardDark: {
    backgroundColor: '#111827',
    borderColor: '#2D2D44',
  },
  optionCardSelected: {
    borderColor: '#8b5cf6',
    backgroundColor: '#f5f3ff',
  },
  optionCardSelectedDark: {
    borderColor: '#8b5cf6',
    backgroundColor: 'rgba(139,92,246,0.08)',
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconDark: {
    backgroundColor: '#374151',
  },
  optionIconSelected: {
    backgroundColor: '#ede9fe',
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDark: {
    borderColor: '#4b5563',
  },
  radioSelected: {
    borderColor: '#8b5cf6',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#8b5cf6',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  rememberRowDark: {
    backgroundColor: '#111827',
    borderColor: '#2D2D44',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxDark: {
    borderColor: '#4b5563',
  },
  checkboxChecked: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  rememberText: {
    flex: 1,
    gap: 2,
  },
  rememberLabel: {
    fontSize: 14,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    minHeight: 54,
  },
  ctaIcon: {
    marginRight: 2,
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
})
