import type { Currency, Language } from '@/types'
import { CURRENCIES } from '@constants/currencies'
import { getCurrencyName } from '@utils/currency'
import { useMemo } from 'react'

export type CurrencyWithoutFavorite = Omit<Currency, 'isFavorite'>

interface UseFilteredCurrenciesOptions {
  searchQuery: string
  language: Language
  priorityCodes?: string[]
  excludeCodes?: string[]
}

export function useFilteredCurrencies({
  searchQuery,
  language,
  priorityCodes = [],
  excludeCodes = [],
}: UseFilteredCurrenciesOptions): CurrencyWithoutFavorite[] {
  return useMemo(() => {
    const query = searchQuery.toLowerCase()

    let filtered =
      excludeCodes.length > 0
        ? CURRENCIES.filter((c) => !excludeCodes.includes(c.code))
        : [...CURRENCIES]

    if (query) {
      filtered = filtered.filter((currency) => {
        const name = getCurrencyName(currency, language)
        return (
          currency.code.toLowerCase().includes(query) ||
          name.toLowerCase().includes(query) ||
          currency.symbol.toLowerCase().includes(query)
        )
      })
    }

    if (priorityCodes.length > 0) {
      const priorityIndex = new Map(priorityCodes.map((code, i) => [code, i]))
      filtered.sort((a, b) => {
        const aIdx = priorityIndex.get(a.code)
        const bIdx = priorityIndex.get(b.code)
        if (aIdx !== undefined && bIdx !== undefined) return aIdx - bIdx
        if (aIdx !== undefined) return -1
        if (bIdx !== undefined) return 1
        return 0
      })
    }

    return filtered
  }, [searchQuery, language, priorityCodes, excludeCodes])
}
