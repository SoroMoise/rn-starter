import { AdBanner } from '@/components/ads/AdBanner'
import { AlertsBottomSheet } from '@/components/alerts/AlertsBottomSheet'
import { AllAlertsBottomSheet } from '@/components/alerts/AllAlertsBottomSheet'
import { ConversionStatusBanners } from '@/components/conversion/ConversionStatusBanners'
import { SourceCard } from '@/components/conversion/SourceCard'
import { TargetCurrencyList } from '@/components/conversion/TargetCurrencyList'
import { ExportBottomSheet, ExportButtonWithGate } from '@/components/export'
import { AppRatingModal } from '@/components/ui/AppRatingModal'
import { ScreenHeading } from '@/components/ui/ScreenHeading'
import { WidgetTooltipSheet } from '@/components/widget/WidgetTooltipSheet'
import { AD_BANNER_INDEX_ENABLED, ADMOB_INDEX_BANNER_ID } from '@/constants/admob'
import { getCurrencyByCode } from '@/constants/currencies'
import { useContextualPaywall } from '@/hooks/useContextualPaywall'
import { usePremium } from '@/hooks/usePremium'
import { useAdFree } from '@/providers/AdFreeProvider'
import { useToast } from '@/providers/ToastProvider'
import { analyticsService } from '@/services/api/analyticsService'
import { engagementService } from '@/services/api/engagementService'
import { promoCoordinator } from '@/services/promo/promoCoordinator'
import { widgetStorage } from '@/services/storage/domains/widget'
import { evaluateTooltipTrigger } from '@/services/widget/evaluateTooltipTrigger'
import { useCurrencyStore } from '@/stores/currencyStore'
import { useDeepLinkStore } from '@/stores/deepLinkStore'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { useQuickConversionsStore } from '@/stores/quickConversionsStore'
import { useWidgetSheetStore } from '@/stores/widgetSheetStore'
import type { Currency } from '@/types'
import { triggerSuccess } from '@/utils/haptics'
import { CalculatorKeyboard } from '@components/calculator/CalculatorKeyboard'
import { CurrencyMultiPicker } from '@components/currency/CurrencyMultiPicker'
import { CurrencyPicker } from '@components/currency/CurrencyPicker'
import { PullToRefreshTutorial } from '@components/ui/PullToRefreshTutorial'
import { ScreenContainer } from '@components/ui/ScreenContainer'
import { QUICK_CONVERSIONS_CONFIG } from '@constants/config'
import { useConverterExport } from '@hooks/useConverterExport'
import { useConverterRating } from '@hooks/useConverterRating'
import { useConverterUIState } from '@hooks/useConverterUIState'
import { useCurrencyInitialization } from '@hooks/useCurrencyInitialization'
import { useCurrencyRates } from '@hooks/useCurrencyRates'
import { useMultiConversion } from '@hooks/useMultiConversion'
import { useNetworkStatus } from '@hooks/useNetworkStatus'
import { useTabBarPadding } from '@hooks/useTabBarPadding'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, RefreshControl, View } from 'react-native'
import { WidgetWatchlist } from 'widget-watchlist'

export default function ConverterScreen() {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const { isAdFreeActive } = useAdFree()
  const { isPremium, isInitialized, isPaywallVisible, openPaywall } = usePremium()
  const isOnboardingCompleted = useOnboardingStore((s) => s.isCompleted)
  const { maybeTrigger } = useContextualPaywall()
  const [alertSheetTargetCode, setAlertSheetTargetCode] = useState<string | null>(null)
  const [allAlertsVisible, setAllAlertsVisible] = useState(false)
  const lastUpdate = useCurrencyStore((s) => s.lastUpdate)
  const initializationError = useCurrencyStore((s) => s.initializationError)
  const quickCurrencies = useQuickConversionsStore((s) => s.quickCurrencies)
  const setMultipleCurrencies = useQuickConversionsStore((s) => s.setMultipleCurrencies)

  const { isOnline } = useNetworkStatus()

  const {
    showTutorial,
    setShowTutorial,
    showSourcePicker,
    setShowSourcePicker,
    showAddPicker,
    setShowAddPicker,
    showCalculator,
    setShowCalculator,
    isDragging,
    setIsDragging,
    markPullToRefreshTutorialSeen,
  } = useConverterUIState()

  const [conversionActionCount, setConversionActionCount] = useState(0)
  const [tooltipVisible, setTooltipVisible] = useState(false)

  const { fromCurrency, amount, setAmount, updateFromCurrency, swapWithTarget } =
    useCurrencyInitialization()

  const { rates, isLoading, error, refresh, clearError } = useCurrencyRates('USD', true)

  const { conversions } = useMultiConversion({
    fromCurrency,
    targetCodes: quickCurrencies,
    rates,
    amount,
  })

  const {
    isExporting,
    exportSheetVisible,
    setExportSheetVisible,
    exportSheetType,
    triggerExport,
    handleExportByFormat,
    allRatesDropdownOptions,
  } = useConverterExport({ conversions, fromCurrency, amount, rates })

  const { isRatingModalVisible, handleRateApp, handleRateLater, handleDeclineRating } =
    useConverterRating({
      conversions,
      fromCurrencyCode: fromCurrency.code,
      amount,
      isAdFreeActive: isAdFreeActive || isPremium,
      conversionActionCount,
    })

  const showAds = isInitialized && !isAdFreeActive && AD_BANNER_INDEX_ENABLED && !isPremium
  const tabBarPadding = useTabBarPadding(showAds ? 60 : 0) + 20

  useEffect(() => {
    if (error) {
      showToast({ message: error.message || t('error.unknownError'), type: 'error' })
      clearError()
    }
  }, [error, t, clearError, showToast])

  const handleRefresh = useCallback(async () => {
    if (!isOnline) {
      showToast({ message: t('common.offline'), type: 'error' })
      return
    }
    if (showTutorial) {
      setShowTutorial(false)
      await markPullToRefreshTutorialSeen()
      analyticsService.track('pull_to_refresh_tutorial_dismissed')
    }
    const dataAgeS = lastUpdate ? Math.round((Date.now() - lastUpdate.getTime()) / 1000) : null
    const refreshError = await refresh()
    analyticsService.track('rates_refreshed', {
      result: refreshError ? 'error' : 'success',
      is_offline: false,
      ...(dataAgeS !== null && { data_age_s: dataAgeS }),
    })
    if (!refreshError) showToast({ message: t('conversion.refreshSuccess'), type: 'success' })
  }, [
    showTutorial,
    setShowTutorial,
    markPullToRefreshTutorialSeen,
    refresh,
    showToast,
    t,
    isOnline,
    lastUpdate,
  ])

  const handleAddCurrencies = useCallback(
    (currencies: Currency[]) => {
      const codes = currencies.map((c) => c.code)
      setMultipleCurrencies(codes)
      analyticsService.track('target_currencies_added', {
        currencies_count: codes.length,
        currencies: codes.join(',').slice(0, 100),
      })
      void analyticsService.setUserProperty('currency_count', String(codes.length))
      setShowAddPicker(false)
      setTimeout(() => maybeTrigger('power_action'), 1000)
    },
    [setMultipleCurrencies, setShowAddPicker, maybeTrigger]
  )

  const handleSourceCurrencySelected = useCallback(
    (currency: Currency) => {
      analyticsService.track('source_currency_changed', {
        from_code: fromCurrency.code,
        to_code: currency.code,
      })
      void analyticsService.setUserProperty('source_currency', currency.code)
      updateFromCurrency(currency)
      setShowSourcePicker(false)
    },
    [fromCurrency.code, updateFromCurrency, setShowSourcePicker]
  )

  const handleCurrencySwap = useCallback(
    (targetCode: string) => {
      analyticsService.track('currency_swap', { from_code: fromCurrency.code, to_code: targetCode })
      swapWithTarget(targetCode)
    },
    [fromCurrency.code, swapWithTarget]
  )

  const handleAlertPress = useCallback((targetCode: string) => {
    setAlertSheetTargetCode(targetCode)
  }, [])

  const handleUnlockAlerts = useCallback(() => {
    setAlertSheetTargetCode(null)
    setAllAlertsVisible(false)
    void openPaywall({ source: 'alerts_row_button' })
  }, [openPaywall])

  const widgetParams = useLocalSearchParams<{ source?: string }>()
  const router = useRouter()
  useEffect(() => {
    if (!isInitialized) return
    const source = typeof widgetParams.source === 'string' ? widgetParams.source : ''
    if (!source.startsWith('widget_')) return
    router.setParams({ source: undefined })

    if (isPremium) return

    void openPaywall({ source })
  }, [isInitialized, isPremium, widgetParams.source, openPaywall, router])

  const pendingAlert = useDeepLinkStore((s) => s.pendingAlert)
  const consumePendingAlert = useDeepLinkStore((s) => s.consumePendingAlert)

  useEffect(() => {
    if (!pendingAlert) return
    const { fromCurrency: fromCode, toCurrency: toCode } = pendingAlert
    const fromCurrencyObj = getCurrencyByCode(fromCode)
    if (fromCurrencyObj) {
      updateFromCurrency({ ...fromCurrencyObj, isFavorite: false })
    }
    if (!quickCurrencies.includes(toCode)) {
      const filtered = quickCurrencies.filter((c) => c !== fromCode)
      setMultipleCurrencies([toCode, ...filtered])
    }
    analyticsService.track('alert_deeplink_consumed', {
      alert_id: pendingAlert.alertId,
      from_currency: fromCode,
      to_currency: toCode,
    })
    consumePendingAlert()
  }, [
    pendingAlert,
    quickCurrencies,
    updateFromCurrency,
    setMultipleCurrencies,
    consumePendingAlert,
  ])

  useEffect(() => {
    if (!isInitialized) return
    if (Platform.OS !== 'android') return
    if (!isOnboardingCompleted) return
    if (!promoCoordinator.canPresentAutoPromo()) return
    let cancelled = false
    void (async () => {
      const sessionCount = engagementService.getSessionContext()?.sessionCount ?? 0
      const allow = await evaluateTooltipTrigger({
        sessionCount,
        tooltipShown: widgetStorage.hasTooltipBeenShown(),
        isWidgetAdded: () => WidgetWatchlist.isWidgetAdded(),
      })
      if (!allow || cancelled || !promoCoordinator.canPresentAutoPromo()) return
      widgetStorage.setTooltipShown()
      promoCoordinator.markAutoPromoShown()
      promoCoordinator.setTooltipVisible(true)
      setTooltipVisible(true)
      analyticsService.track('widget_tooltip_shown', {
        session_count: sessionCount,
        is_pro: isPremium,
      })
    })()
    return () => {
      cancelled = true
    }
  }, [isInitialized, isOnboardingCompleted, isPaywallVisible, isPremium])

  const listHeader = useMemo(
    () => (
      <View className="mx-3" style={{ marginTop: 10 }}>
        <ScreenHeading
          title={t('conversion.title')}
          subtitle={t('conversion.subtitle')}
          action={
            <ExportButtonWithGate
              isPremium={isPremium}
              onExport={() => triggerExport('conversion')}
              loading={isExporting}
              dropdownOptions={allRatesDropdownOptions}
              mainGateKey="conversion"
              dropdownGateKeys={['allRates']}
            />
          }
        />

        <ConversionStatusBanners />

        <SourceCard
          currency={fromCurrency}
          amount={amount}
          onCurrencyPress={() => setShowSourcePicker(true)}
          onAmountPress={() => {
            analyticsService.track('calculator_opened')
            setShowCalculator(true)
          }}
        />
      </View>
    ),
    [
      t,
      isPremium,
      isExporting,
      triggerExport,
      allRatesDropdownOptions,
      fromCurrency,
      amount,
      setShowSourcePicker,
      setShowCalculator,
    ]
  )

  const refreshControl = useMemo(
    () => <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} enabled={!isDragging} />,
    [isLoading, handleRefresh, isDragging]
  )

  return (
    <ScreenContainer>
      {!initializationError && <PullToRefreshTutorial visible={showTutorial} />}

      <TargetCurrencyList
        conversions={conversions}
        fromCurrencyCode={fromCurrency.code}
        onSwap={handleCurrencySwap}
        onAddCurrency={() => setShowAddPicker(true)}
        onAlertPress={handleAlertPress}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
        listHeader={listHeader}
        refreshControl={refreshControl}
        contentContainerStyle={{ paddingBottom: tabBarPadding }}
        isInitialLoading={rates === null && !initializationError}
      />

      <AlertsBottomSheet
        visible={alertSheetTargetCode !== null}
        onClose={() => setAlertSheetTargetCode(null)}
        fromCurrency={fromCurrency.code}
        toCurrency={alertSheetTargetCode ?? ''}
        isPreview={!isPremium}
        onUnlockPress={handleUnlockAlerts}
        onSeeAllPress={() => setAllAlertsVisible(true)}
      />

      <AllAlertsBottomSheet
        visible={allAlertsVisible}
        onClose={() => setAllAlertsVisible(false)}
        isPreview={!isPremium}
        onUnlockPress={handleUnlockAlerts}
      />

      <CurrencyPicker
        visible={showSourcePicker}
        onClose={() => setShowSourcePicker(false)}
        onSelect={handleSourceCurrencySelected}
        selectedCode={fromCurrency.code}
      />

      <CurrencyMultiPicker
        visible={showAddPicker}
        onClose={() => setShowAddPicker(false)}
        onValidate={handleAddCurrencies}
        preSelectedCodes={quickCurrencies}
        excludeCodes={[fromCurrency.code]}
        minSelection={QUICK_CONVERSIONS_CONFIG.MIN_QUICK_CURRENCIES}
      />

      <AdBanner
        adBannerId={ADMOB_INDEX_BANNER_ID}
        screenName="index"
        enabled={AD_BANNER_INDEX_ENABLED}
      />

      <CalculatorKeyboard
        visible={showCalculator}
        onClose={() => setShowCalculator(false)}
        onResult={(value) => {
          triggerSuccess()
          analyticsService.track('calculator_result_applied')
          setAmount(value)
          setConversionActionCount((c) => c + 1)
          setShowCalculator(false)
          setTimeout(() => maybeTrigger('after_n_conversions'), 1200)
        }}
        initialValue={amount}
      />

      <AppRatingModal
        visible={isRatingModalVisible}
        onRate={handleRateApp}
        onLater={handleRateLater}
        onDecline={handleDeclineRating}
      />

      {isPremium && (
        <ExportBottomSheet
          visible={exportSheetVisible}
          onClose={() => setExportSheetVisible(false)}
          exportType={exportSheetType}
          title={
            exportSheetType === 'conversion'
              ? t('export.sheetConversionTitle')
              : t('export.sheetAllRatesTitle')
          }
          subtitle={
            exportSheetType === 'conversion'
              ? t('export.sheetSubtitleConversion', {
                  amount,
                  currency: fromCurrency.code,
                  count: conversions.length,
                })
              : t('export.sheetSubtitleAllRates', {
                  base: fromCurrency.code,
                  count: rates ? Object.keys(rates.rates).length : 0,
                })
          }
          onExport={({ format }) => void handleExportByFormat({ type: exportSheetType, format })}
        />
      )}

      <WidgetTooltipSheet
        visible={tooltipVisible}
        onDismiss={() => {
          setTooltipVisible(false)
          promoCoordinator.setTooltipVisible(false)
          analyticsService.track('widget_tooltip_dismissed')
        }}
        onCtaTap={() => {
          analyticsService.track('widget_tooltip_cta_tap')
          setTooltipVisible(false)
          promoCoordinator.setTooltipVisible(false)
          useWidgetSheetStore.getState().open()
        }}
      />
    </ScreenContainer>
  )
}
