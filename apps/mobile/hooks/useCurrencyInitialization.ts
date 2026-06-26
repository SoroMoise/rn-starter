import { conversionStorage } from '@/services/storage/domains/conversion'
import { widgetService } from '@/services/widget/widgetService'
import { useSettingsStore } from '@/stores/settingsStore'
import { useStatisticsStore } from '@/stores/statisticsStore'
import type { Currency } from '@/types'
import { getCurrencyByCode } from '@constants/currencies'
import { useQuickConversionsStore } from '@stores/quickConversionsStore'
import { triggerBackupSync } from '@stores/backupTrigger'
import { useCallback, useEffect, useState } from 'react'

export function useCurrencyInitialization() {
  const syncFromConversion = useStatisticsStore((s) => s.syncFromConversion)
  const quickCurrencies = useQuickConversionsStore((s) => s.quickCurrencies)

  const [fromCurrency, setFromCurrency] = useState<Currency>(() => {
    const code = useSettingsStore.getState().settings.defaultCurrencyFrom
    const currency = getCurrencyByCode(code)
    return { ...currency, isFavorite: false }
  })

  const [amount, setAmount] = useState('1')

  useEffect(() => {
    const lastConversion = conversionStorage.getLast()
    if (lastConversion) {
      const { amount: savedAmount, fromCurrencyCode } = lastConversion
      const loadedFromCurrency = getCurrencyByCode(fromCurrencyCode)

      if (loadedFromCurrency) {
        setFromCurrency({ ...loadedFromCurrency, isFavorite: false })
      }

      if (savedAmount) {
        setAmount(savedAmount)
      }
    } else {
      const { defaultCurrencyFrom } = useSettingsStore.getState().settings
      const fallbackFrom = getCurrencyByCode(defaultCurrencyFrom)
      if (fallbackFrom) {
        setFromCurrency({ ...fallbackFrom, isFavorite: false })
      }
    }
  }, [])

  useEffect(() => {
    const firstTarget = quickCurrencies.find((c) => c !== fromCurrency.code)
    if (firstTarget) {
      syncFromConversion(fromCurrency.code, firstTarget)
    }
  }, [fromCurrency.code, quickCurrencies, syncFromConversion])

  useEffect(() => {
    void widgetService.refresh()
  }, [])

  const updateFromCurrency = useCallback((currency: Currency) => {
    setFromCurrency({ ...currency, isFavorite: false })
  }, [])

  const swapWithTarget = useCallback((targetCode: string) => {
    const targetCurrency = getCurrencyByCode(targetCode)
    setFromCurrency({ ...targetCurrency, isFavorite: false })
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!amount || !fromCurrency) return
      const next = { amount, fromCurrencyCode: fromCurrency.code }
      // Boot re-saves the values it just loaded: re-persisting them must not
      // schedule a cloud sync that could overwrite a newer remote backup
      // while the restore offer is still on screen.
      if (conversionStorage.isSameAsLast(next)) return
      conversionStorage.saveLast(next)
      triggerBackupSync()
    }, 500)

    return () => clearTimeout(timer)
  }, [amount, fromCurrency])

  return {
    fromCurrency,
    amount,
    setAmount,
    updateFromCurrency,
    swapWithTarget,
  }
}
