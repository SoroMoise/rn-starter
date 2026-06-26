import { CurrencyPicker } from '@/components/currency/CurrencyPicker'
import { ModalBottomSheet } from '@/components/ui/ModalBottomSheet'
import { SlidingSelector } from '@/components/ui/SlidingSelector'
import { ThemedText } from '@/components/ui/ThemedText'
import { HowToAddSheet } from '@/components/widget/HowToAddSheet'
import { PairPickerRow } from '@/components/widget/PairPickerRow'
import { ReorderablePairs } from '@/components/widget/ReorderablePairs'
import { WidgetPreviewCard } from '@/components/widget/WidgetPreviewCard'
import { usePremium } from '@/hooks/usePremium'
import { useWidgetPreviewData } from '@/hooks/useWidgetPreviewData'
import { analyticsService } from '@/services/api/analyticsService'
import { widgetService } from '@/services/widget/widgetService'
import { useCurrencyStore } from '@/stores/currencyStore'
import { useWidgetSheetStore } from '@/stores/widgetSheetStore'
import {
  useWidgetStore,
  WIDGET_PERIOD_OPTIONS,
  type PairKey,
  type WidgetPeriodDays,
} from '@/stores/widgetStore'
import type { Currency } from '@/types'
import { triggerLight } from '@/utils/haptics'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, ScrollView, View } from 'react-native'
import { useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type PickerTarget = { index: 0 | 1 | 2; side: 'from' | 'to' }

export function WidgetSettingsSheet() {
  const { t } = useTranslation()
  const { isPremium, openPaywall } = usePremium()
  const insets = useSafeAreaInsets()

  const isOpen = useWidgetSheetStore((s) => s.isOpen)
  const close = useWidgetSheetStore((s) => s.close)

  const pairs = useWidgetStore((s) => s.pairs)
  const period = useWidgetStore((s) => s.period)
  const setPair = useWidgetStore((s) => s.setPair)
  const swapPair = useWidgetStore((s) => s.swapPair)
  const reorderPairs = useWidgetStore((s) => s.reorderPairs)
  const setPeriod = useWidgetStore((s) => s.setPeriod)

  const hasRates = useCurrencyStore((s) => s.rates !== null)

  const [howToVisible, setHowToVisible] = useState(false)
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null)
  const dragLock = useSharedValue(false)
  const trackedOpenRef = useRef(false)

  useEffect(() => {
    if (!isOpen) {
      trackedOpenRef.current = false
      return
    }
    if (!trackedOpenRef.current) {
      trackedOpenRef.current = true
      analyticsService.track('widget_settings_opened', { is_pro: isPremium })
    }
    if (isPremium) void widgetService.syncFromStorage().catch(() => undefined)
  }, [isOpen, isPremium])

  const previewData = useWidgetPreviewData({
    pairs,
    period,
    enabled: isOpen && isPremium,
  })

  const periodOptions = useMemo(
    () =>
      WIDGET_PERIOD_OPTIONS.map((days) => ({
        value: days,
        label: periodLabel({ days, t }),
      })),
    [t]
  )

  const handlePeriodChange = useCallback(
    (next: WidgetPeriodDays) => {
      if (next === period) return
      const previous = period
      setPeriod(next)
      analyticsService.track('widget_period_changed', {
        period_days: next,
        previous_period_days: previous,
      })
    },
    [period, setPeriod]
  )

  const handleOpenHowTo = useCallback(() => {
    triggerLight()
    setHowToVisible(true)
    analyticsService.track('widget_instructions_sheet_shown', { entry_point: 'settings' })
  }, [])

  const handleOpenPicker = useCallback((target: PickerTarget) => {
    analyticsService.track('widget_pair_picker_opened', {
      slot_index: target.index,
      side: target.side,
    })
    setPickerTarget(target)
  }, [])

  const handlePickerSelect = useCallback(
    (currency: Currency) => {
      if (!pickerTarget) return
      const current: PairKey = pairs[pickerTarget.index]
      const next: PairKey =
        pickerTarget.side === 'from'
          ? { from: currency.code, to: current.to }
          : { from: current.from, to: currency.code }
      setPair(pickerTarget.index, next)
      setPickerTarget(null)
      analyticsService.track('widget_config_changed', { pairs_changed_count: 1 })
    },
    [pickerTarget, pairs, setPair]
  )

  const handleSwapPair = useCallback(
    (index: 0 | 1 | 2) => {
      swapPair(index)
      analyticsService.track('widget_config_changed', { pairs_changed_count: 1 })
    },
    [swapPair]
  )

  const handleReorder = useCallback(
    ({ from, to }: { from: number; to: number }) => {
      if (from === to) return
      reorderPairs(from, to)
      analyticsService.track('widget_pairs_reordered', { from_position: from, to_position: to })
    },
    [reorderPairs]
  )

  const handleClose = useCallback(() => {
    dragLock.value = false
    setPickerTarget(null)
    setHowToVisible(false)
    close()
  }, [close, dragLock])

  const renderPairRow = useCallback(
    (item: PairKey, index: number) => (
      <View className="px-4 pb-2">
        <PairPickerRow
          index={index}
          from={item.from}
          to={item.to}
          onEditFrom={() => handleOpenPicker({ index: index as 0 | 1 | 2, side: 'from' })}
          onEditTo={() => handleOpenPicker({ index: index as 0 | 1 | 2, side: 'to' })}
          onSwap={() => handleSwapPair(index as 0 | 1 | 2)}
          draggable
        />
      </View>
    ),
    [handleOpenPicker, handleSwapPair]
  )

  const listHeader = useMemo(
    () => (
      <View className="pt-1">
        <WidgetPreviewCard pairs={previewData} isOffline={!hasRates} />
        {isPremium && <View className="h-5" />}
      </View>
    ),
    [previewData, hasRates, isPremium]
  )

  const listFooter = useMemo(
    () => (
      <View>
        <View className="mt-6 px-4">
          <ThemedText variant="label" color="muted" weight="medium" className="mb-2 px-2">
            {t('settings.widget.periodLabel')}
          </ThemedText>
          <View className="rounded-2xl bg-white p-2 dark:bg-gray-800">
            <SlidingSelector
              options={periodOptions}
              value={period}
              onChange={handlePeriodChange}
              variant="white"
            />
          </View>
        </View>

        <View className="mt-6 px-4">
          <Pressable
            onPress={handleOpenHowTo}
            className="items-center rounded-2xl bg-white px-6 py-4 active:opacity-80 dark:bg-gray-800">
            <ThemedText variant="body" weight="semibold">
              {t('settings.widget.howToAdd')}
            </ThemedText>
          </Pressable>
        </View>
      </View>
    ),
    [periodOptions, period, handlePeriodChange, handleOpenHowTo, t]
  )

  return (
    <>
      <ModalBottomSheet
        visible={isOpen}
        onClose={handleClose}
        title={t('settings.widget.screenTitle')}
        dragLock={dragLock}>
        {isPremium ? (
          <View style={{ paddingBottom: insets.bottom + 32 }}>
            {listHeader}
            <ReorderablePairs
              data={pairs}
              dragLock={dragLock}
              keyExtractor={(item) => `${item.from}-${item.to}`}
              renderRow={renderPairRow}
              onReorder={handleReorder}
            />
            {listFooter}
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
            showsVerticalScrollIndicator={false}>
            {listHeader}
            <View className="mt-6 px-6">
              <ThemedText variant="title" weight="bold" className="mb-3">
                {t('settings.widget.proPitchHeadline')}
              </ThemedText>
              <PitchBullet label={t('settings.widget.proPitchBullet1')} />
              <PitchBullet label={t('settings.widget.proPitchBullet2')} />
              <PitchBullet label={t('settings.widget.proPitchBullet3')} />
            </View>
            <View className="mt-6 px-4">
              <Pressable
                onPress={() => {
                  triggerLight()
                  void openPaywall({ source: 'widget_settings' })
                }}
                className="items-center rounded-2xl bg-amber-400 px-6 py-4 active:opacity-80">
                <ThemedText variant="body" weight="bold" color="inherit" className="text-stone-900">
                  {t('settings.widget.proCta')}
                </ThemedText>
              </Pressable>
            </View>
            {listFooter}
          </ScrollView>
        )}
      </ModalBottomSheet>

      <CurrencyPicker
        visible={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        onSelect={handlePickerSelect}
        selectedCode={
          pickerTarget
            ? pickerTarget.side === 'from'
              ? pairs[pickerTarget.index]?.from
              : pairs[pickerTarget.index]?.to
            : undefined
        }
      />

      <HowToAddSheet visible={howToVisible} onClose={() => setHowToVisible(false)} />
    </>
  )
}

function PitchBullet({ label }: { label: string }) {
  return (
    <View className="mb-2 flex-row items-start">
      <ThemedText variant="body" weight="semibold" color="inherit" className="mr-2 text-amber-500">
        •
      </ThemedText>
      <ThemedText variant="body" className="flex-1">
        {label}
      </ThemedText>
    </View>
  )
}

function periodLabel({ days, t }: { days: WidgetPeriodDays; t: (key: string) => string }): string {
  return t(`statistics.days${days}`)
}
