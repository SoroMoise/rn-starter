import type { Currency } from '@/types/currency'
import type { Language } from '@/types/settings'

export function getCurrencyName(
  currency: Pick<Currency, 'localizedNames' | 'name'>,
  language: Language
): string {
  return currency.localizedNames[language] || currency.name
}
