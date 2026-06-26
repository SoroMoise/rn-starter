import type { ConversionResult, Currency, ExchangeRate } from '@/types'

export interface ConvertCurrencyParams {
  amount: number
  fromCurrency: Currency
  toCurrency: Currency
  rates: ExchangeRate | null
}

export function convertCurrency({
  amount,
  fromCurrency,
  toCurrency,
  rates,
}: ConvertCurrencyParams): ConversionResult | null {
  if (!rates || amount < 0 || isNaN(amount)) {
    return null
  }

  if (fromCurrency.code === toCurrency.code) {
    return {
      amount,
      from: fromCurrency,
      to: toCurrency,
      result: amount,
      rate: 1,
      timestamp: new Date(),
    }
  }

  const fromRate = rates.rates[fromCurrency.code]
  const toRate = rates.rates[toCurrency.code]

  if (!fromRate || !toRate) {
    return null
  }

  const rateCalculation = toRate / fromRate
  const result = amount * rateCalculation

  return {
    amount,
    from: fromCurrency,
    to: toCurrency,
    result,
    rate: rateCalculation,
    timestamp: new Date(),
  }
}

export function calculatePercentageChange(oldRate: number, newRate: number): number {
  if (oldRate === 0) return 0
  return ((newRate - oldRate) / oldRate) * 100
}

export function roundAmount(amount: number, decimals: number): number {
  const multiplier = Math.pow(10, decimals)
  return Math.round(amount * multiplier) / multiplier
}

export function swapCurrencies(
  fromCurrency: Currency,
  toCurrency: Currency
): { from: Currency; to: Currency } {
  return {
    from: toCurrency,
    to: fromCurrency,
  }
}
