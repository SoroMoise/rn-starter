import type { DropdownOption } from '@/components/export'
import { useToast } from '@/providers/ToastProvider'
import { analyticsService } from '@/services/api/analyticsService'
import { crashlyticsService } from '@/services/api/crashlyticsService'
import {
  exportAllRatesCSV,
  exportAllRatesPDF,
  exportConversionCSV,
  exportConversionPDF,
} from '@/services/api/exportService'
import { useExportPreferencesStore } from '@/stores/exportPreferencesStore'
import type { Currency, ExchangeRate } from '@/types'
import type { MultiConversionResult } from '@hooks/useMultiConversion'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform } from 'react-native'

interface UseConverterExportParams {
  conversions: MultiConversionResult[]
  fromCurrency: Currency
  amount: string
  rates: ExchangeRate | null
}

export function useConverterExport({
  conversions,
  fromCurrency,
  amount,
  rates,
}: UseConverterExportParams) {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const getPreference = useExportPreferencesStore((s) => s.getPreference)

  const [isExporting, setIsExporting] = useState(false)
  const [exportSheetVisible, setExportSheetVisible] = useState(false)
  const [exportSheetType, setExportSheetType] = useState<'conversion' | 'allRates'>('conversion')

  const handleExportByFormat = useCallback(
    async ({ type, format }: { type: 'conversion' | 'allRates'; format: 'csv' | 'pdf' }) => {
      if (isExporting) return
      setIsExporting(true)
      const startedAt = Date.now()
      analyticsService.logExportStarted({ type, format, source: 'converter' })
      try {
        const date = new Date()
        if (type === 'conversion') {
          if (format === 'csv') {
            await exportConversionCSV({ conversions, fromCurrency, amount, date })
          } else {
            await exportConversionPDF({ conversions, fromCurrency, amount, date })
          }
        } else {
          if (!rates) return
          if (format === 'csv') {
            await exportAllRatesCSV({ rates, baseCurrency: fromCurrency.code, date })
          } else {
            await exportAllRatesPDF({ rates, baseCurrency: fromCurrency.code, date })
          }
        }
        analyticsService.logExportCompleted({ type, format, durationMs: Date.now() - startedAt })
        const successKey =
          Platform.OS === 'android' ? 'export.successToastAndroid' : 'export.successToast'
        showToast({ message: t(successKey), type: 'success' })
      } catch (err) {
        const error = err instanceof Error ? err : new Error('unknown export error')
        crashlyticsService.recordError(error, { source: `export.${type}.${format}` })
        analyticsService.logExportFailed({ type, format, error: error.message })
        showToast({ message: t('export.errorToast'), type: 'error' })
      } finally {
        setIsExporting(false)
      }
    },
    [isExporting, conversions, fromCurrency, amount, rates, showToast, t]
  )

  const triggerExport = useCallback(
    (type: 'conversion' | 'allRates') => {
      const saved = getPreference({ type })
      if (saved) {
        void handleExportByFormat({ type, format: saved })
      } else {
        analyticsService.logExportBottomSheetShown({ type })
        setExportSheetType(type)
        setExportSheetVisible(true)
      }
    },
    [getPreference, handleExportByFormat]
  )

  const allRatesDropdownOptions = useMemo<DropdownOption[]>(
    () => [
      {
        label: t('export.allRatesOption'),
        subtitle: t('export.allRatesSubtitle', { base: fromCurrency.code }),
        icon: 'grid-outline',
        onPress: () => {
          analyticsService.logExportDropdownOpened()
          triggerExport('allRates')
        },
      },
    ],
    [t, fromCurrency.code, triggerExport]
  )

  return {
    isExporting,
    exportSheetVisible,
    setExportSheetVisible,
    exportSheetType,
    triggerExport,
    handleExportByFormat,
    allRatesDropdownOptions,
  }
}
