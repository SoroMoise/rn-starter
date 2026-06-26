import { CURRENCY_LIST } from '@repo/shared/constants/currencies'

const SUPPORTED_CODES = new Set(CURRENCY_LIST.map((c) => c.code))

export function isSupportedCurrency(code: string): boolean {
  return SUPPORTED_CODES.has(code)
}
