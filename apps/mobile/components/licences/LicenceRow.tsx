import { Divider } from '@/components/settings/SettingsSection'
import { ThemedText } from '@/components/ui/ThemedText'
import { UI_COLORS } from '@/constants/uiColors'
import type { LicenceEntry, LicenceTextOrigin } from '@/types'
import { openExternalLink } from '@/utils/linking'
import Ionicons from '@expo/vector-icons/Ionicons'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, Pressable, View } from 'react-native'

type LicenceRowProps = {
  entry: LicenceEntry
  text: string | undefined
  isFirst: boolean
  isLast: boolean
  isExpanded: boolean
  onToggle: (id: string) => void
}

const ORIGIN_KEYS: Partial<Record<LicenceTextOrigin, string>> = {
  repository: 'licences.origin.repository',
  spdx: 'licences.origin.spdx',
  'spdx-template': 'licences.origin.spdxTemplate',
  pom: 'licences.origin.pom',
}

// NativeWind's `font-mono` names Android's "mono", which is no system family: the text would fall
// back to the proportional face and lose the alignment licence texts are laid out in.
const MONOSPACE = { fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }) }

function LinkLine({ label, url }: { label: string; url: string }) {
  return (
    <Pressable
      onPress={() => void openExternalLink({ url })}
      accessibilityRole="link"
      className="min-h-[44px] justify-center self-start active:opacity-60">
      <ThemedText variant="label" color="primary">
        {label}
      </ThemedText>
    </Pressable>
  )
}

export const LicenceRow = memo(function LicenceRow({
  entry,
  text,
  isFirst,
  isLast,
  isExpanded,
  onToggle,
}: LicenceRowProps) {
  const { t } = useTranslation()
  const subtitle = [entry.version, entry.licence].filter(Boolean).join(' · ')
  const originKey = ORIGIN_KEYS[entry.textOrigin]

  return (
    <View
      className={`bg-white dark:bg-gray-800 ${isFirst ? 'rounded-t-2xl' : ''} ${isLast ? 'mb-3 rounded-b-2xl' : ''}`}>
      {isFirst ? null : <Divider />}
      <Pressable
        onPress={() => onToggle(entry.id)}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        accessibilityHint={t('licences.a11y.toggle')}
        className="min-h-[52px] flex-row items-center px-4 py-3 active:opacity-60">
        <View className="flex-1 pe-3">
          <ThemedText variant="body" weight="medium">
            {entry.name}
          </ThemedText>
          <ThemedText variant="caption" color="muted" className="mt-0.5">
            {subtitle}
          </ThemedText>
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={UI_COLORS.chevron}
          importantForAccessibility="no"
        />
      </Pressable>

      {isExpanded ? (
        <View className="px-4 pb-4">
          {entry.notes.map((note) => (
            <ThemedText key={note} variant="label" weight="normal" color="dimmed" className="mb-2">
              {note}
            </ThemedText>
          ))}
          {originKey ? (
            <ThemedText variant="label" weight="normal" color="muted" className="mb-2">
              {t(originKey)}
            </ThemedText>
          ) : null}
          {text ? (
            <View className="mt-1 rounded-xl bg-gray-50 p-3 dark:bg-gray-900">
              <ThemedText variant="caption" selectable style={MONOSPACE}>
                {text}
              </ThemedText>
            </View>
          ) : null}
          {entry.termsUrl ? (
            <LinkLine label={t('licences.readTerms')} url={entry.termsUrl} />
          ) : null}
          {entry.url ? <LinkLine label={t('licences.projectPage')} url={entry.url} /> : null}
        </View>
      ) : null}
    </View>
  )
})
