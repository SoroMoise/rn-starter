import type { ConversionResult, Currency, ExchangeRate } from '@/types'
import { useDebounce } from '@hooks/useDebounce'
import { convertCurrency } from '@utils/conversion'
import { useMemo } from 'react'

interface UseConversionProps {
  fromCurrency: Currency
  toCurrency: Currency
  rates: ExchangeRate | null
  amount: string
}

export function useConversion({ fromCurrency, toCurrency, rates, amount }: UseConversionProps) {
  const debouncedAmount = useDebounce(amount, 300)

  const conversionResult = useMemo<ConversionResult | null>(() => {
    const numericAmount = parseFloat(debouncedAmount)

    if (isNaN(numericAmount) || numericAmount < 0 || !rates) {
      return null
    }

    return convertCurrency({
      amount: numericAmount,
      fromCurrency,
      toCurrency,
      rates,
    })
  }, [debouncedAmount, fromCurrency, toCurrency, rates])

  return {
    conversionResult,
  }
}
