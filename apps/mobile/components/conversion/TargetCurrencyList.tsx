import { ThemedText } from '@/components/ui/ThemedText'
import { QUICK_CONVERSIONS_CONFIG } from '@/constants/config'
import type { MultiConversionResult } from '@/hooks/useMultiConversion'
import { analyticsService } from '@/services/api/analyticsService'
import { useQuickConversionsStore } from '@/stores/quickConversionsStore'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useThemedColor } from '@hooks/useThemedColor'
import React, { useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  type RefreshControlProps,
  type StyleProp,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native'
import { Gesture, type Swipeable } from 'react-native-gesture-handler'
import { LinearTransition, runOnJS } from 'react-native-reanimated'
import ReorderableList, {
  type ReorderableListCellAnimations,
  type ReorderableListRenderItemInfo,
  type ReorderableListReorderEvent,
  reorderItems,
  useIsActive,
  useReorderableDrag,
} from 'react-native-reorderable-list'
import { TargetCurrencyRow } from './TargetCurrencyRow'
import { TargetCurrencyRowSkeleton } from './TargetCurrencyRowSkeleton'

const SKELETON_ROW_COUNT = 5

// Rows start a drag via TouchableOpacity's onLongPress (RN default delayLongPress: 500ms).
// Activating the reorder pan slightly later lets quick vertical swipes fall through to the
// native scroll + RefreshControl — otherwise the pan eats scrolling once the list overflows
// (documented react-native-reorderable-list / Android gesture conflict).
const DRAG_ACTIVATE_AFTER_LONG_PRESS_MS = 520

// Keep the default scale "lift" on the dragged cell but disable the default opacity
// dim so the row's own active styling (indigo background + shadow) stays vivid.
const CELL_ANIMATIONS: ReorderableListCellAnimations = { opacity: 1 }
const ITEM_LAYOUT_ANIMATION = LinearTransition.springify().damping(18).stiffness(180)

interface TargetCurrencyListProps {
  conversions: MultiConversionResult[]
  fromCurrencyCode: string
  onSwap: (targetCode: string) => void
  onAddCurrency: () => void
  onAlertPress?: (targetCode: string) => void
  onDragStart?: () => void
  onDragEnd?: () => void
  listHeader?: React.ReactElement | null
  refreshControl?: React.ReactElement<RefreshControlProps>
  contentContainerStyle?: StyleProp<ViewStyle>
  isInitialLoading?: boolean
}

interface ReorderableTargetRowProps {
  item: MultiConversionResult
  fromCurrencyCode: string
  onSwap: (targetCode: string) => void
  onRemove: (targetCode: string) => void
  onAlertPress?: (targetCode: string) => void
  canDelete: boolean
  onSwipeOpen: (swipeable: Swipeable) => void
  onSwipeClose: (swipeable: Swipeable) => void
}

const ReorderableTargetRow = React.memo(function ReorderableTargetRow({
  item,
  fromCurrencyCode,
  onSwap,
  onRemove,
  onAlertPress,
  canDelete,
  onSwipeOpen,
  onSwipeClose,
}: ReorderableTargetRowProps) {
  const drag = useReorderableDrag()
  const isActive = useIsActive()

  const handlePress = useCallback(() => onSwap(item.code), [onSwap, item.code])
  const handleDelete = useCallback(() => onRemove(item.code), [onRemove, item.code])
  const handleAlert = useMemo(
    () => (onAlertPress ? () => onAlertPress(item.code) : undefined),
    [onAlertPress, item.code]
  )

  return (
    <TargetCurrencyRow
      currency={item.currency}
      result={item.result}
      rate={item.rate}
      fromCurrencyCode={fromCurrencyCode}
      onPress={handlePress}
      onLongPress={drag}
      onDelete={handleDelete}
      onAlertPress={handleAlert}
      canDelete={canDelete}
      isActive={isActive}
      onSwipeOpen={onSwipeOpen}
      onSwipeClose={onSwipeClose}
    />
  )
})

function TargetCurrencyListImpl({
  conversions,
  fromCurrencyCode,
  onSwap,
  onAddCurrency,
  onAlertPress,
  onDragStart,
  onDragEnd,
  listHeader = null,
  refreshControl,
  contentContainerStyle,
  isInitialLoading = false,
}: TargetCurrencyListProps) {
  const { t } = useTranslation()
  const isDark = useThemedColor()
  const quickCurrencies = useQuickConversionsStore((s) => s.quickCurrencies)
  const reorderCurrencies = useQuickConversionsStore((s) => s.reorderCurrencies)
  const removeCurrency = useQuickConversionsStore((s) => s.removeCurrency)

  const canDelete = quickCurrencies.length > QUICK_CONVERSIONS_CONFIG.MIN_QUICK_CURRENCIES

  const activeSwipeableRef = useRef<Swipeable | null>(null)

  const handleSwipeOpen = useCallback((swipeable: Swipeable) => {
    if (activeSwipeableRef.current && activeSwipeableRef.current !== swipeable) {
      activeSwipeableRef.current.close()
    }
    activeSwipeableRef.current = swipeable
  }, [])

  const handleSwipeClose = useCallback((swipeable: Swipeable) => {
    if (activeSwipeableRef.current === swipeable) {
      activeSwipeableRef.current = null
    }
  }, [])

  const closeActiveSwipeable = useCallback(() => {
    activeSwipeableRef.current?.close()
    activeSwipeableRef.current = null
  }, [])

  const handleRemove = useCallback(
    (code: string) => {
      analyticsService.track('target_currency_removed', {
        currency_code: code,
        source: 'converter_swipe',
      })
      removeCurrency(code)
    },
    [removeCurrency]
  )

  const handleReorder = useCallback(
    ({ from, to }: ReorderableListReorderEvent) => {
      const movedItem = conversions[from]
      const reorderedCodes = reorderItems(conversions, from, to).map((c) => c.code)

      if (movedItem) {
        analyticsService.track('currency_reordered', {
          currency_code: movedItem.code,
          from_position: from,
          to_position: to,
          total_currencies: conversions.length,
        })
      }

      const sourceIndex = quickCurrencies.indexOf(fromCurrencyCode)
      if (sourceIndex !== -1) {
        const clampedIndex = Math.min(sourceIndex, reorderedCodes.length)
        reorderCurrencies([
          ...reorderedCodes.slice(0, clampedIndex),
          fromCurrencyCode,
          ...reorderedCodes.slice(clampedIndex),
        ])
      } else {
        reorderCurrencies(reorderedCodes)
      }
    },
    [conversions, quickCurrencies, fromCurrencyCode, reorderCurrencies]
  )

  const handleListDragStart = useCallback(() => {
    'worklet'
    runOnJS(closeActiveSwipeable)()
    if (onDragStart) runOnJS(onDragStart)()
  }, [closeActiveSwipeable, onDragStart])

  const handleListDragEnd = useCallback(() => {
    'worklet'
    if (onDragEnd) runOnJS(onDragEnd)()
  }, [onDragEnd])

  const panGesture = useMemo(
    () => Gesture.Pan().activateAfterLongPress(DRAG_ACTIVATE_AFTER_LONG_PRESS_MS),
    []
  )

  const renderItem = useCallback(
    ({ item }: ReorderableListRenderItemInfo<MultiConversionResult>) => (
      <ReorderableTargetRow
        item={item}
        fromCurrencyCode={fromCurrencyCode}
        onSwap={onSwap}
        onRemove={handleRemove}
        onAlertPress={onAlertPress}
        canDelete={canDelete}
        onSwipeOpen={handleSwipeOpen}
        onSwipeClose={handleSwipeClose}
      />
    ),
    [
      fromCurrencyCode,
      onSwap,
      handleRemove,
      onAlertPress,
      canDelete,
      handleSwipeOpen,
      handleSwipeClose,
    ]
  )

  const internalHeader = useMemo(
    () => (
      <>
        {listHeader}
        <View className="mx-3 mb-3 mt-2 flex-row items-center gap-3">
          <View className="flex-1 border-b border-gray-200 dark:border-gray-700" />
          <ThemedText
            variant="sectionHeader"
            color="subtle"
            className="text-[10px] tracking-widest">
            {t('conversion.conversions')}
          </ThemedText>
          <View className="flex-1 border-b border-gray-200 dark:border-gray-700" />
        </View>
      </>
    ),
    [listHeader, t]
  )

  const emptyComponent = useMemo(() => {
    if (!isInitialLoading) return null
    return (
      <View style={{ gap: 2 }}>
        {Array.from({ length: SKELETON_ROW_COUNT }).map((_, i) => (
          <TargetCurrencyRowSkeleton key={i} />
        ))}
      </View>
    )
  }, [isInitialLoading])

  const internalFooter = useMemo(
    () => (
      <TouchableOpacity
        onPress={onAddCurrency}
        activeOpacity={0.7}
        className="mx-3 mt-2 flex-row items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 py-3 dark:border-gray-600"
        accessibilityRole="button"
        accessibilityLabel={t('settings.addCurrency')}>
        <Ionicons name="add" size={18} color={isDark ? '#9ca3af' : '#6b7280'} />
        <ThemedText variant="label" color="muted">
          {t('settings.addCurrency')}
        </ThemedText>
      </TouchableOpacity>
    ),
    [onAddCurrency, isDark, t]
  )

  return (
    <ReorderableList
      data={conversions}
      keyExtractor={(item) => item.code}
      renderItem={renderItem}
      onReorder={handleReorder}
      onDragStart={handleListDragStart}
      onDragEnd={handleListDragEnd}
      panGesture={panGesture}
      shouldUpdateActiveItem
      cellAnimations={CELL_ANIMATIONS}
      itemLayoutAnimation={ITEM_LAYOUT_ANIMATION}
      style={{ flex: 1 }}
      contentContainerStyle={[{ gap: 2 }, contentContainerStyle]}
      ListHeaderComponent={internalHeader}
      ListFooterComponent={internalFooter}
      ListEmptyComponent={emptyComponent}
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}
      initialNumToRender={15}
      windowSize={11}
      maxToRenderPerBatch={10}
    />
  )
}

export const TargetCurrencyList = React.memo(TargetCurrencyListImpl)
