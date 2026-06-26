import type { Currency, ExchangeRate } from '@/types'
import { getCurrencyByCode } from '@constants/currencies'
import { convertCurrency } from '@utils/conversion'
import { useMemo } from 'react'

export interface MultiConversionResult {
  code: string
  currency: Currency
  result: number
  rate: number
}

interface UseMultiConversionProps {
  fromCurrency: Currency
  targetCodes: string[]
  rates: ExchangeRate | null
  amount: string
}

export function useMultiConversion({
  fromCurrency,
  targetCodes,
  rates,
  amount,
}: UseMultiConversionProps) {
  const conversions = useMemo<MultiConversionResult[]>(() => {
    const numericAmount = parseFloat(amount)

    if (isNaN(numericAmount) || numericAmount < 0 || !rates) {
      return []
    }

    return targetCodes
      .filter((code) => code !== fromCurrency.code)
      .map((code) => {
        const currency = getCurrencyByCode(code)
        if (!currency) return null

        const toCurrency: Currency = { ...currency, isFavorite: false }
        const result = convertCurrency({
          amount: numericAmount,
          fromCurrency,
          toCurrency,
          rates,
        })

        if (!result) return null

        return {
          code,
          currency: toCurrency,
          result: result.result,
          rate: result.rate,
        }
      })
      .filter((r): r is MultiConversionResult => r !== null)
  }, [amount, fromCurrency, targetCodes, rates])

  return { conversions }
}
