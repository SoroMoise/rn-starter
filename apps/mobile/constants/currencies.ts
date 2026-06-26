import type { Currency, Language } from '@/types'
import currencyData from './currencyData.json'
import currencyNames from './currencyNames.json'

const typedNames = currencyNames as Record<string, Partial<Record<Language, string>>>

export const CURRENCIES: Omit<Currency, 'isFavorite'>[] = currencyData.map((entry) => ({
  code: entry.code,
  name: entry.name,
  localizedNames: typedNames[entry.code] || {},
  symbol: entry.symbol,
  flag: entry.flag,
}))

const currencyMap = new Map(CURRENCIES.map((c) => [c.code, c]))

export const getCurrencyByCode = (code: string): Omit<Currency, 'isFavorite'> => {
  const currency = currencyMap.get(code)

  if (!currency) {
    console.warn(`[Currencies] Unknown currency code: ${code}`)
    return { code, name: code, localizedNames: {}, symbol: '', flag: '' }
  }
  return currency
}
