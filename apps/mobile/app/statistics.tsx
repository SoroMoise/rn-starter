import { AdBanner } from '@/components/ads/AdBanner'
import { ExchangeRateChart } from '@/components/charts/ExchangeRateChart'
import { StatisticsCard } from '@/components/charts/StatisticsCard'
import { StatisticsChartSkeleton } from '@/components/charts/StatisticsChartSkeleton'
import { CurrencyPicker } from '@/components/currency/CurrencyPicker'
import { ExportBottomSheet, ExportButtonWithGate } from '@/components/export'
import { AlertsBell } from '@/components/statistics/AlertsBell'
import { StatisticsCurrencyPairSelector } from '@/components/statistics/StatisticsCurrencyPairSelector'
import { StatisticsPeriodSelector } from '@/components/statistics/StatisticsPeriodSelector'
import { OfflineBanner } from '@/components/ui/OfflineBanner'
import { ScreenContainer } from '@/components/ui/ScreenContainer'
import { ScreenHeading } from '@/components/ui/ScreenHeading'
import { ThemedText } from '@/components/ui/ThemedText'
import { AD_BANNER_STATISTICS_ENABLED, ADMOB_STATISTICS_BANNER_ID } from '@/constants/admob'
import { DEFAULT_SETTINGS } from '@/constants/config'
import { getCurrencyByCode } from '@/constants/currencies'
import { useHistoricalRates } from '@/hooks/useHistoricalRates'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { usePremium } from '@/hooks/usePremium'
import { useAdFree } from '@/providers/AdFreeProvider'
import { useToast } from '@/providers/ToastProvider'
import { analyticsService } from '@/services/api/analyticsService'
import { crashlyticsService } from '@/services/api/crashlyticsService'
import { exportHistoricalCSV, exportHistoricalPDF } from '@/services/api/exportService'
import { conversionStorage } from '@/services/storage/domains/conversion'
import { useExportPreferencesStore } from '@/stores/exportPreferencesStore'
import { useQuickConversionsStore } from '@/stores/quickConversionsStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useStatisticsStore } from '@/stores/statisticsStore'
import type { Currency, Period } from '@/types'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTabBarPadding } from '@hooks/useTabBarPadding'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native'

export default function StatisticsScreen() {
  const { t } = useTranslation()
  const decimals = useSettingsStore((state) => state.settings.decimals)
  const { showToast } = useToast()
  const { isAdFreeActive } = useAdFree()
  const { isPremium, isInitialized } = usePremium()

  const fromCurrencyCode = useStatisticsStore((s) => s.fromCurrency)
  const toCurrencyCode = useStatisticsStore((s) => s.toCurrency)
  const selectedPeriod = useStatisticsStore((s) => s.period)
  const isManualMode = useStatisticsStore((s) => s.isManualMode)
  const setPeriod = useStatisticsStore((s) => s.setPeriod)
  const setCurrenciesManually = useStatisticsStore((s) => s.setCurrenciesManually)
  const resetToAuto = useStatisticsStore((s) => s.resetToAuto)

  const {
    rates: historicalRates,
    statistics,
    fetchedAt: dataFetchedAt,
    status,
    isFetching,
    isStale,
    error,
    refetch,
  } = useHistoricalRates()

  const isLoading = status === 'loading'
  const { isOnline } = useNetworkStatus()

  const getPreference = useExportPreferencesStore((s) => s.getPreference)
  const [isExporting, setIsExporting] = useState(false)
  const [exportSheetVisible, setExportSheetVisible] = useState(false)

  const handleHistoricalExport = useCallback(
    async ({ format }: { format: 'csv' | 'pdf' }) => {
      if (isExporting || historicalRates.length === 0 || !statistics) return
      setIsExporting(true)
      const startedAt = Date.now()
      analyticsService.logExportStarted({ type: 'historical', format, source: 'statistics' })
      try {
        const params = {
          rates: historicalRates,
          fromCurrency: fromCurrencyCode,
          toCurrency: toCurrencyCode,
          period: selectedPeriod,
          statistics,
          date: new Date(),
        }
        if (format === 'csv') {
          await exportHistoricalCSV(params)
        } else {
          await exportHistoricalPDF(params)
        }
        analyticsService.logExportCompleted({
          type: 'historical',
          format,
          durationMs: Date.now() - startedAt,
        })
        const successKey =
          Platform.OS === 'android' ? 'export.successToastAndroid' : 'export.successToast'
        showToast({ message: t(successKey), type: 'success' })
      } catch (err) {
        const exportError = err instanceof Error ? err : new Error('unknown export error')
        crashlyticsService.recordError(exportError, { source: `export.historical.${format}` })
        analyticsService.logExportFailed({
          type: 'historical',
          format,
          error: exportError.message,
        })
        showToast({ message: t('export.errorToast'), type: 'error' })
      } finally {
        setIsExporting(false)
      }
    },
    [
      isExporting,
      historicalRates,
      fromCurrencyCode,
      toCurrencyCode,
      selectedPeriod,
      statistics,
      showToast,
      t,
    ]
  )

  const triggerHistoricalExport = useCallback(() => {
    const saved = getPreference({ type: 'historical' })
    if (saved) {
      void handleHistoricalExport({ format: saved })
    } else {
      analyticsService.logExportBottomSheetShown({ type: 'historical' })
      setExportSheetVisible(true)
    }
  }, [getPreference, handleHistoricalExport])

  const canExport = historicalRates.length > 0 && !!statistics

  const showAds = isInitialized && !isAdFreeActive && AD_BANNER_STATISTICS_ENABLED && !isPremium
  const tabBarPadding = useTabBarPadding(showAds ? 60 : 0) + 20

  const [showFromPicker, setShowFromPicker] = useState(false)
  const [showToPicker, setShowToPicker] = useState(false)
  const [scrollEnabled, setScrollEnabled] = useState(true)

  useEffect(() => {
    if (error && historicalRates.length > 0) {
      showToast({ message: error.message || t('error.unknownError'), type: 'error' })
    }
  }, [error, historicalRates.length, showToast, t])

  const widgetParams = useLocalSearchParams<{
    from?: string
    to?: string
    source?: string
    position?: string
    period?: string
  }>()
  const router = useRouter()
  useEffect(() => {
    const source = typeof widgetParams.source === 'string' ? widgetParams.source : ''
    if (!source.startsWith('widget_')) return
    const from = typeof widgetParams.from === 'string' ? widgetParams.from : ''
    const to = typeof widgetParams.to === 'string' ? widgetParams.to : ''
    if (!from || !to) return
    setCurrenciesManually(from, to)

    // The widget's variation % and sparkline are computed for its configured
    // period. Opening statistics from a widget row must adopt that same period
    // so the chart and trend match exactly what the user tapped on.
    const rawPeriod =
      typeof widgetParams.period === 'string' ? Number.parseInt(widgetParams.period, 10) : NaN
    const matchedPeriod = ([7, 30, 90, 270, 365] as const).find((p) => p === rawPeriod)
    if (matchedPeriod) setPeriod(matchedPeriod)

    if (source === 'widget_pair') {
      const rawPosition = typeof widgetParams.position === 'string' ? widgetParams.position : '0'
      const parsed = Number.parseInt(rawPosition, 10)
      analyticsService.track('widget_pair_tap', {
        from,
        to,
        position: Number.isFinite(parsed) ? parsed : 0,
      })
    }
    router.setParams({
      from: undefined,
      to: undefined,
      source: undefined,
      position: undefined,
      period: undefined,
    })
  }, [
    widgetParams.from,
    widgetParams.to,
    widgetParams.source,
    widgetParams.position,
    widgetParams.period,
    setCurrenciesManually,
    setPeriod,
    router,
  ])

  const quickCurrencies = useQuickConversionsStore((s) => s.quickCurrencies)

  const handleSyncAuto = useCallback(() => {
    const lastConversion = conversionStorage.getLast()
    const fromCode =
      lastConversion?.fromCurrencyCode ?? useSettingsStore.getState().settings.defaultCurrencyFrom
    const toCode = quickCurrencies.find((c) => c !== fromCode) ?? DEFAULT_SETTINGS.defaultCurrencyTo
    resetToAuto()
    useStatisticsStore.setState({ fromCurrency: fromCode, toCurrency: toCode })
  }, [resetToAuto, quickCurrencies])

  const fromCurrency = useMemo<Currency>(() => {
    const currency = getCurrencyByCode(fromCurrencyCode)
    return { ...currency, isFavorite: false }
  }, [fromCurrencyCode])

  const toCurrency = useMemo<Currency>(() => {
    const currency = getCurrencyByCode(toCurrencyCode)
    return { ...currency, isFavorite: false }
  }, [toCurrencyCode])

  const handleRefresh = useCallback(async () => {
    if (!isOnline) {
      showToast({ message: t('common.offline'), type: 'error' })
      return
    }
    if (isFetching) return

    const success = await refetch()

    const latest = useStatisticsStore.getState()
    analyticsService.track('statistics_refreshed', {
      result: success ? 'success' : 'error',
      from_currency: latest.fromCurrency,
      to_currency: latest.toCurrency,
      period_days: latest.period,
    })
    if (success) {
      showToast({ message: t('statistics.refreshSuccess'), type: 'success' })
    }
  }, [isOnline, isFetching, refetch, showToast, t])

  const handleFromCurrencySelect = useCallback(
    (currency: Currency) => {
      analyticsService.track('statistics_currency_changed', {
        side: 'from',
        currency_code: currency.code,
        from_currency: currency.code,
        to_currency: toCurrencyCode,
      })
      setCurrenciesManually(currency.code, toCurrencyCode)
    },
    [setCurrenciesManually, toCurrencyCode]
  )

  const handleToCurrencySelect = useCallback(
    (currency: Currency) => {
      analyticsService.track('statistics_currency_changed', {
        side: 'to',
        currency_code: currency.code,
        from_currency: fromCurrencyCode,
        to_currency: currency.code,
      })
      setCurrenciesManually(fromCurrencyCode, currency.code)
    },
    [setCurrenciesManually, fromCurrencyCode]
  )

  const handleSwapCurrencies = useCallback(() => {
    setCurrenciesManually(toCurrencyCode, fromCurrencyCode)
  }, [setCurrenciesManually, fromCurrencyCode, toCurrencyCode])

  return (
    <ScreenContainer>
      <ScrollView
        className="mx-3 flex-1"
        scrollEnabled={scrollEnabled}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          marginTop: 10,
          paddingBottom: tabBarPadding,
        }}
        refreshControl={
          <RefreshControl refreshing={isFetching && !isStale} onRefresh={handleRefresh} />
        }>
        <ScreenHeading
          title={t('statistics.title')}
          subtitle={t('statistics.subtitle')}
          action={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {canExport && (
                <ExportButtonWithGate
                  isPremium={isPremium}
                  onExport={triggerHistoricalExport}
                  loading={isExporting}
                  mainGateKey="historical"
                />
              )}
              <AlertsBell fromCurrency={fromCurrencyCode} toCurrency={toCurrencyCode} />
            </View>
          }
        />

        {!isOnline && <OfflineBanner timestamp={dataFetchedAt} />}

        <StatisticsCurrencyPairSelector
          fromCurrency={fromCurrency}
          toCurrency={toCurrency}
          onFromPress={() => setShowFromPicker(true)}
          onToPress={() => setShowToPicker(true)}
          onSwap={handleSwapCurrencies}
        />

        {isManualMode && (
          <TouchableOpacity
            onPress={handleSyncAuto}
            className="mb-2 flex-row items-center justify-center gap-2 rounded-lg bg-blue-50 px-4 py-2 dark:bg-blue-900/20"
            activeOpacity={0.7}>
            <Ionicons name="sync-outline" size={14} color="#3b82f6" />
            <ThemedText variant="label" className="text-blue-600 dark:text-blue-400">
              {t('statistics.syncAuto')}
            </ThemedText>
          </TouchableOpacity>
        )}

        <StatisticsPeriodSelector
          selectedPeriod={selectedPeriod}
          onSelect={(period: Period) => {
            analyticsService.track('statistics_period_changed', {
              period_days: period,
              previous_period_days: selectedPeriod,
            })
            setPeriod(period)
          }}
        />

        {isLoading && historicalRates.length === 0 ? (
          <StatisticsChartSkeleton />
        ) : historicalRates.length === 0 ? (
          error ? (
            <View className="mt-20 items-center justify-center">
              <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
              <ThemedText color="muted" align="center" className="mt-4">
                {t('statistics.error')}
              </ThemedText>
              <TouchableOpacity
                onPress={handleRefresh}
                className="mt-4 rounded-xl bg-blue-500 px-6 py-3"
                activeOpacity={0.7}>
                <ThemedText weight="semibold" color="inverse">
                  {t('common.retry')}
                </ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="mt-20 items-center justify-center">
              <Ionicons name="bar-chart-outline" size={48} color="#9ca3af" />
              <ThemedText color="muted" align="center" className="mt-4">
                {t('common.noData')}
              </ThemedText>
            </View>
          )
        ) : (
          <View style={{ opacity: isStale ? 0.4 : 1 }}>
            <ExchangeRateChart
              data={historicalRates}
              onInteractionStart={() => setScrollEnabled(false)}
              onInteractionEnd={() => setScrollEnabled(true)}
            />
            {statistics && <StatisticsCard statistics={statistics} decimals={decimals} />}
          </View>
        )}
      </ScrollView>

      <CurrencyPicker
        visible={showFromPicker}
        onClose={() => setShowFromPicker(false)}
        onSelect={handleFromCurrencySelect}
        selectedCode={fromCurrency.code}
      />

      <CurrencyPicker
        visible={showToPicker}
        onClose={() => setShowToPicker(false)}
        onSelect={handleToCurrencySelect}
        selectedCode={toCurrency.code}
      />

      <AdBanner
        adBannerId={ADMOB_STATISTICS_BANNER_ID}
        screenName="statistics"
        enabled={AD_BANNER_STATISTICS_ENABLED}
      />

      {isPremium && (
        <ExportBottomSheet
          visible={exportSheetVisible}
          onClose={() => setExportSheetVisible(false)}
          exportType="historical"
          title={t('export.sheetHistoricalTitle')}
          subtitle={`${fromCurrencyCode}/${toCurrencyCode} · ${t(`statistics.days${selectedPeriod}`)}`}
          onExport={({ format }) => void handleHistoricalExport({ format })}
        />
      )}
    </ScreenContainer>
  )
}
