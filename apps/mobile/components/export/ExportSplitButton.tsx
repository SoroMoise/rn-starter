import { ThemedText } from '@/components/ui/ThemedText'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useThemedColor } from '@hooks/useThemedColor'
import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  type LayoutRectangle,
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'

export type DropdownOption = {
  label: string
  subtitle: string
  icon: keyof typeof Ionicons.glyphMap
  onPress: () => void
}

type ExportSplitButtonProps = {
  onExport: () => void
  loading?: boolean
  dropdownOptions?: DropdownOption[]
}

export function ExportSplitButton({
  onExport,
  loading = false,
  dropdownOptions,
}: ExportSplitButtonProps) {
  const { t } = useTranslation()
  const isDark = useThemedColor()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const buttonRef = useRef<View>(null)
  const [buttonLayout, setButtonLayout] = useState<LayoutRectangle | null>(null)

  const hasSplit = dropdownOptions && dropdownOptions.length > 0

  const handleArrowPress = () => {
    setDropdownOpen((v) => !v)
  }

  const handleOptionPress = (option: DropdownOption) => {
    setDropdownOpen(false)
    option.onPress()
  }

  return (
    <View
      ref={buttonRef}
      style={styles.wrapper}
      onLayout={() => {
        buttonRef.current?.measureInWindow(
          // eslint-disable-next-line max-params
          (x, y, width, height) => {
            setButtonLayout({ x, y, width, height })
          }
        )
      }}>
      <View style={[styles.button, isDark ? styles.buttonDark : styles.buttonLight]}>
        <TouchableOpacity
          style={{ ...styles.mainPart, ...(!hasSplit ? { paddingHorizontal: 15 } : {}) }}
          onPress={onExport}
          disabled={loading}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('export.button')}>
          {loading ? (
            <ActivityIndicator size="small" color="#7c3aed" />
          ) : (
            <Ionicons
              name="document-text-outline"
              size={13}
              color={isDark ? VIOLET : VIOLET + 'b0'}
            />
          )}

          <ThemedText
            className="text-md font-semibold"
            style={{ color: isDark ? VIOLET : VIOLET + 'b0' }}
            color="inherit">
            {t('export.button')}
          </ThemedText>
        </TouchableOpacity>

        {hasSplit && (
          <>
            <View style={[styles.separator, isDark && styles.separatorDark]} />
            <TouchableOpacity
              style={styles.arrowPart}
              onPress={handleArrowPress}
              disabled={loading}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('export.exportOptionsLabel')}>
              <Ionicons
                name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={12}
                color={isDark ? VIOLET : VIOLET + 'b0'}
              />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Dropdown dans le Modal pour éviter le clipping Android */}
      {dropdownOpen && hasSplit && (
        <Modal
          visible={dropdownOpen}
          transparent
          animationType="none"
          onRequestClose={() => setDropdownOpen(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setDropdownOpen(false)} />
          {buttonLayout && (
            <View
              style={[
                styles.dropdown,
                isDark && styles.dropdownDark,
                {
                  position: 'absolute',
                  top: buttonLayout.y + buttonLayout.height + 4,
                  left: buttonLayout.x + buttonLayout.width - 240,
                },
              ]}
              pointerEvents="box-none">
              {dropdownOptions!.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dropdownItem,
                    isDark && styles.dropdownItemDark,
                    index > 0 && styles.dropdownItemBorder,
                    index > 0 && isDark && styles.dropdownItemBorderDark,
                  ]}
                  onPress={() => handleOptionPress(option)}
                  activeOpacity={0.7}>
                  <View style={[styles.dropdownIcon, isDark && styles.dropdownIconDark]}>
                    <Ionicons
                      name={option.icon}
                      size={18}
                      color={isDark ? VIOLET : VIOLET + 'b0'}
                    />
                  </View>
                  <View style={styles.dropdownText}>
                    <ThemedText variant="body" weight="semibold" style={styles.dropdownLabel}>
                      {option.label}
                    </ThemedText>
                    <ThemedText variant="caption" color="muted">
                      {option.subtitle}
                    </ThemedText>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={isDark ? VIOLET : VIOLET + 'b0'}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Modal>
      )}
    </View>
  )
}

const VIOLET = '#7C3AED'
const VIOLET_BG_LIGHT = '#f5f3ff'
const VIOLET_BG_DARK = 'rgba(139,92,246,0.08)'
const VIOLET_BORDER = '#c4b5fd'

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    zIndex: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    height: 30,
  },
  buttonLight: {
    backgroundColor: VIOLET_BG_LIGHT,
    borderColor: VIOLET + '90',
  },
  buttonDark: {
    backgroundColor: VIOLET_BG_DARK,
    borderColor: VIOLET + '90',
  },
  mainPart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  separator: {
    width: 1,
    backgroundColor: VIOLET_BORDER,
  },
  separatorDark: {
    backgroundColor: 'rgba(139,92,246,0.4)',
  },
  arrowPart: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  dropdown: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    minWidth: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  dropdownDark: {
    backgroundColor: '#1c1c2e',
    borderColor: '#2d2d44',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    backgroundColor: '#faf5ff',
  },
  dropdownItemDark: {
    backgroundColor: 'rgba(139,92,246,0.06)',
  },
  dropdownItemBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
  },
  dropdownItemBorderDark: {
    borderTopColor: '#2d2d44',
  },
  dropdownIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dropdownIconDark: {
    backgroundColor: 'rgba(139,92,246,0.15)',
  },
  dropdownText: {
    flex: 1,
    gap: 2,
  },
  dropdownLabel: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
})
