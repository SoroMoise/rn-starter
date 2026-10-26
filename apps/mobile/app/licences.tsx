import { LicenceRow } from '@/components/licences/LicenceRow'
import { useThemeColor } from '@/components/Themed'
import { DirectionalIcon } from '@/components/ui/DirectionalIcon'
import { ScreenContainer } from '@/components/ui/ScreenContainer'
import { ThemedText } from '@/components/ui/ThemedText'
import { UI_CONFIG } from '@/constants/config'
import { buildLicenceRows, loadLicences, type LicenceListRow } from '@/services/licences'
import { resetToHome } from '@/utils/navigation'
import { router } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function LicencesScreen() {
  const { t } = useTranslation()
  const colors = useThemeColor()
  const insets = useSafeAreaInsets()
  const file = useMemo(loadLicences, [])
  const rows = useMemo(() => buildLicenceRows(file), [file])
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set())

  const toggle = useCallback((id: string) => {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const leave = useCallback(() => {
    if (router.canGoBack()) router.back()
    else resetToHome()
  }, [])

  const renderItem = useCallback(
    ({ item }: { item: LicenceListRow }) => {
      if (item.kind === 'header') {
        return (
          <ThemedText variant="sectionHeader" color="muted" className="mb-2 ml-1 mt-3">
            {t(`licences.sections.${item.section}`)}
            {item.count === null ? '' : ` · ${item.count}`}
          </ThemedText>
        )
      }
      if (item.kind === 'androidPending') {
        return (
          <View className="mb-3 rounded-2xl bg-white p-4 dark:bg-gray-800">
            <ThemedText variant="label" weight="normal" color="dimmed">
              {t('licences.androidPending')}
            </ThemedText>
          </View>
        )
      }
      return (
        <LicenceRow
          entry={item.entry}
          text={item.entry.textId ? file.texts[item.entry.textId] : undefined}
          isFirst={item.isFirst}
          isLast={item.isLast}
          isExpanded={expanded.has(item.entry.id)}
          onToggle={toggle}
        />
      )
    },
    [expanded, file, t, toggle]
  )

  return (
    <ScreenContainer>
      <View className="min-h-14 flex-row items-center gap-1 px-2">
        <Pressable
          onPress={leave}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          className="min-h-[48px] min-w-[48px] items-center justify-center rounded-xl active:opacity-60">
          <DirectionalIcon name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <ThemedText variant="heading" accessibilityRole="header" className="flex-1 pe-3">
          {t('licences.title')}
        </ThemedText>
      </View>

      <FlatList
        className="flex-1"
        data={rows}
        keyExtractor={(row) => row.key}
        renderItem={renderItem}
        extraData={expanded}
        initialNumToRender={24}
        windowSize={11}
        contentContainerStyle={{
          paddingHorizontal: UI_CONFIG.SCREEN_GUTTER,
          paddingBottom: insets.bottom + 24,
        }}
        ListHeaderComponent={
          <ThemedText variant="label" weight="normal" color="muted" className="mb-2 mt-1">
            {t('licences.intro')}
          </ThemedText>
        }
      />
    </ScreenContainer>
  )
}
