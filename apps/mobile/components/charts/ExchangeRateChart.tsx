import { ThemedText } from '@/components/ui/ThemedText'
import i18n from '@/i18n/service'
import type { HistoricalRate, Language } from '@/types'
import { buildLabelIndices } from '@/utils/chartLabels'
import { getDateFnsLocale } from '@/utils/date'
import { downsampleLTTB } from '@/utils/downsample'
import { formatRateLocalized } from '@/utils/formatters'
import { useThemedColor } from '@hooks/useThemedColor'
import { useSettingsStore } from '@stores/settingsStore'
import { format, isSameWeek, isSameYear, max, min, parseISO } from 'date-fns'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { LineChart } from 'react-native-gifted-charts'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

interface ExchangeRateChartProps {
  data: HistoricalRate[]
  onInteractionStart?: () => void
  onInteractionEnd?: () => void
}

interface SelectedPoint {
  value: number
  dataDate: string
}

type ChartDataItem = {
  value: number
  dataDate: string
}

const CHART_HEIGHT = 180
const Y_AXIS_WIDTH = 52
const INITIAL_SPACING = 5
const LABEL_WIDTH = 50

// The API returns one point per day, so a long period (270/365 days) would push
// hundreds of SVG nodes into a chart that re-renders on every scrub frame. Cap
// the rendered points so render cost stays bounded regardless of the period; LTTB
// preserves the visual peaks/troughs. Short periods (<= cap) are left untouched.
const MAX_CHART_POINTS = 120

export function ExchangeRateChart({
  data,
  onInteractionStart,
  onInteractionEnd,
}: ExchangeRateChartProps) {
  const { t, i18n: i18nHook } = useTranslation()
  const decimals = useSettingsStore((s) => s.settings.decimals)
  const isDark = useThemedColor()
  const locale = getDateFnsLocale(i18n.language as Language)
  const { width: screenWidth } = useWindowDimensions()

  const CHART_WIDTH = screenWidth - 20

  const [selectedPoint, setSelectedPoint] = useState<SelectedPoint | null>(null)
  const setSelectedPointRef = useRef(setSelectedPoint)
  setSelectedPointRef.current = setSelectedPoint

  const onInteractionStartRef = useRef(onInteractionStart)
  onInteractionStartRef.current = onInteractionStart
  const onInteractionEndRef = useRef(onInteractionEnd)
  onInteractionEndRef.current = onInteractionEnd

  const displayData = useMemo(() => downsampleLTTB({ data, threshold: MAX_CHART_POINTS }), [data])

  const lastPointerItemRef = useRef<SelectedPoint | null>(null)

  const isPointerActive = useSharedValue(0)

  useEffect(() => {
    isPointerActive.value = selectedPoint ? 1 : 0
  }, [selectedPoint, isPointerActive])

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isPointerActive.value === 0 ? 1 : 0, { duration: 150 }),
    position: 'absolute',
  }))

  const pointerInfoStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isPointerActive.value === 1 ? 1 : 0, { duration: 150 }),
    position: 'absolute',
  }))

  const formatDate = useMemo(() => {
    if (displayData.length === 0) return (d: string) => d

    const dates = displayData.map((item) => parseISO(item.date))
    const minDate = min(dates)
    const maxDate = max(dates)

    let dateFormat: string
    if (isSameWeek(minDate, maxDate, { weekStartsOn: 1 })) {
      dateFormat = 'EEE'
    } else if (isSameYear(minDate, maxDate)) {
      dateFormat = 'd MMM'
    } else {
      dateFormat = 'MMM yyyy'
    }

    return (dateString: string) => format(parseISO(dateString), dateFormat, { locale })
  }, [displayData, locale])

  const { yMin, yMax } = useMemo(() => {
    if (data.length === 0) return { yMin: 0, yMax: 1 }
    const rates = data.map((item) => item.rate)
    return { yMin: Math.min(...rates), yMax: Math.max(...rates) }
  }, [data])

  const formatFullDate = useCallback(
    (dateString: string) => format(parseISO(dateString), 'd MMM yyyy', { locale }),
    [locale]
  )

  const spacing = useMemo(() => {
    const innerWidth = CHART_WIDTH - Y_AXIS_WIDTH - INITIAL_SPACING
    return Math.max(1, innerWidth / Math.max(displayData.length, 1))
  }, [CHART_WIDTH, displayData.length])

  const chartData = useMemo<ChartDataItem[]>(
    () => displayData.map((item) => ({ value: item.rate, dataDate: item.date })),
    [displayData]
  )

  const xAxisLabels = useMemo(() => {
    return [...buildLabelIndices(displayData.length)]
      .sort((a, b) => a - b)
      .map((index) => ({
        key: index,
        text: displayData[index] ? formatDate(displayData[index].date) : '',
        x: index * spacing,
      }))
  }, [displayData, formatDate, spacing])

  const lineColor = isDark ? '#60a5fa' : '#3b82f6'
  const labelColor = isDark ? '#9ca3af' : '#6b7280'
  const gridColor = isDark ? '#37415150' : '#e5e7eb90'

  const formatYLabel = useCallback(
    (v: string) =>
      formatRateLocalized({
        rate: Number(v),
        decimals: Math.min(decimals, 4),
        locale: i18nHook.language,
      }),
    [decimals, i18nHook.language]
  )

  // Stable reference — only invalidated on theme change.
  // Guards against the setState-during-render infinite loop: pointerLabelComponent
  // is a render function; calling setState from it (even via queueMicrotask) triggers
  // a re-render which calls it again. Memoizing the config object breaks that cycle,
  // and lastPointerItemRef prevents duplicate updates when LineChart still re-renders.
  const pointerConfig = useMemo(
    () => ({
      activatePointersInstantlyOnTouch: true,
      showPointerStrip: true,
      pointerStripColor: lineColor,
      pointerStripWidth: 1.2,
      pointerStripHeight: CHART_HEIGHT,
      pointer1Color: lineColor,
      radius: 3,
      pointerVanishDelay: 3000,
      pointerLabelWidth: 0,
      pointerLabelHeight: 0,
      onTouchStart: () => onInteractionStartRef.current?.(),
      onTouchEnd: () => onInteractionEndRef.current?.(),
      pointerLabelComponent: (items: any) => {
        const item = items[0] as ChartDataItem | undefined
        const newPoint =
          item?.dataDate && typeof item.value === 'number' && Number.isFinite(item.value)
            ? { value: item.value, dataDate: item.dataDate }
            : null
        const prev = lastPointerItemRef.current
        const hasChanged =
          newPoint === null
            ? prev !== null
            : prev === null || prev.value !== newPoint.value || prev.dataDate !== newPoint.dataDate
        if (hasChanged) {
          lastPointerItemRef.current = newPoint
          queueMicrotask(() => setSelectedPointRef.current(newPoint))
        }
        return <View style={styles.hiddenLabel} />
      },
    }),
    [lineColor]
  )

  if (!data || data.length === 0) {
    return (
      <View className="mt-3 rounded-2xl bg-white p-6 dark:bg-gray-800">
        <ThemedText color="muted" align="center">
          {t('common.noData')}
        </ThemedText>
      </View>
    )
  }

  return (
    <View className="mt-3 overflow-hidden rounded-2xl bg-white pt-2 dark:bg-gray-800">
      <View className="h-10 justify-center px-3">
        <Animated.View style={[subtitleStyle, { left: 0, right: 0 }]}>
          <ThemedText variant="subheading" align="center">
            {t('statistics.subtitle')}
          </ThemedText>
        </Animated.View>
        <Animated.View style={[pointerInfoStyle, { left: 0, right: 0 }]}>
          <ThemedText variant="subheading" align="center" style={{ color: lineColor }}>
            {selectedPoint && Number.isFinite(selectedPoint.value)
              ? `${formatRateLocalized({ rate: selectedPoint.value, decimals, locale: i18nHook.language })} • ${formatFullDate(selectedPoint.dataDate)}`
              : ''}
          </ThemedText>
        </Animated.View>
      </View>

      <View style={styles.chartWrapper}>
        <LineChart
          data={chartData}
          width={CHART_WIDTH}
          height={CHART_HEIGHT}
          initialSpacing={INITIAL_SPACING}
          endSpacing={0}
          spacing={spacing}
          curved
          curveType={1}
          areaChart
          startFillColor={lineColor}
          endFillColor={lineColor}
          startOpacity={0.25}
          endOpacity={0.01}
          color={lineColor}
          thickness={1}
          dataPointsRadius={1.3}
          dataPointsColor={lineColor}
          yAxisOffset={yMin}
          maxValue={yMax - yMin}
          yAxisLabelWidth={Y_AXIS_WIDTH}
          yAxisTextStyle={{ color: labelColor, fontSize: 10 }}
          formatYLabel={formatYLabel}
          xAxisColor="transparent"
          yAxisColor="transparent"
          xAxisLabelTextStyle={{ height: 0 }}
          noOfSections={7}
          rulesColor={gridColor}
          rulesType="solid"
          backgroundColor="transparent"
          pointerConfig={pointerConfig}
        />
      </View>

      <View style={[styles.xAxisRow, { marginLeft: Y_AXIS_WIDTH + INITIAL_SPACING }]}>
        {xAxisLabels.map(({ key, text, x }, i) => {
          const isFirst = i === 0
          const isLast = i === xAxisLabels.length - 1
          return (
            <Text
              key={key}
              style={[
                styles.xAxisLabel,
                {
                  color: labelColor,
                  position: 'absolute',
                  left: isFirst ? 0 : isLast ? x - LABEL_WIDTH : x - LABEL_WIDTH / 2,
                  width: LABEL_WIDTH,
                  textAlign: isFirst ? 'left' : isLast ? 'right' : 'center',
                },
              ]}>
              {text}
            </Text>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  chartWrapper: {
    overflow: 'hidden',
  },
  hiddenLabel: {
    width: 0,
    height: 0,
  },
  xAxisRow: {
    position: 'relative',
    height: 22,
    paddingTop: 6,
  },
  xAxisLabel: {
    fontSize: 10,
  },
})
