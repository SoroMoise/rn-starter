import { UI_CONFIG } from '@constants/config'

export function isValidAmount(amount: number): boolean {
  return (
    !isNaN(amount) &&
    isFinite(amount) &&
    amount >= UI_CONFIG.MIN_AMOUNT &&
    amount <= UI_CONFIG.MAX_AMOUNT
  )
}

export function isValidDecimals(decimals: number): boolean {
  return (
    Number.isInteger(decimals) &&
    decimals >= UI_CONFIG.MIN_DECIMALS &&
    decimals <= UI_CONFIG.MAX_DECIMALS
  )
}

export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0
}

export function isNotExpired(timestamp: number, maxAge: number): boolean {
  const now = Date.now()
  return now - timestamp < maxAge
}
