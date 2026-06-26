import { mmkv } from '../mmkv'
import { KEYS } from '../keys'

export type LastConversionInput = {
  amount: string
  fromCurrencyCode: string
}

export const conversionStorage = {
  getLast(): LastConversionInput | null {
    const raw = mmkv.getString(KEYS.LAST_CONVERSION)
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>
      if (typeof parsed.amount === 'string' && typeof parsed.fromCurrencyCode === 'string') {
        return { amount: parsed.amount, fromCurrencyCode: parsed.fromCurrencyCode }
      }
    } catch {
      // fall through
    }
    return null
  },

  saveLast(input: LastConversionInput): void {
    mmkv.set(KEYS.LAST_CONVERSION, JSON.stringify(input))
  },

  isSameAsLast(input: LastConversionInput): boolean {
    const last = conversionStorage.getLast()
    return (
      last !== null &&
      last.amount === input.amount &&
      last.fromCurrencyCode === input.fromCurrencyCode
    )
  },

  getTotalSuccessful(): number {
    const raw = mmkv.getString(KEYS.TOTAL_SUCCESSFUL_CONVERSIONS)
    return raw ? parseInt(raw, 10) || 0 : 0
  },

  incrementSuccessful(): number {
    const next = conversionStorage.getTotalSuccessful() + 1
    mmkv.set(KEYS.TOTAL_SUCCESSFUL_CONVERSIONS, next.toString())
    return next
  },

  saveTotalSuccessful(n: number): void {
    mmkv.set(KEYS.TOTAL_SUCCESSFUL_CONVERSIONS, n.toString())
  },

  getAdLastShown(): number {
    const raw = mmkv.getString(KEYS.AD_LAST_SHOWN)
    return raw ? parseInt(raw, 10) || 0 : 0
  },

  setAdLastShown(ts: number): void {
    mmkv.set(KEYS.AD_LAST_SHOWN, ts.toString())
  },

  getAdExecutionCount(): number {
    const raw = mmkv.getString(KEYS.AD_EXECUTION_COUNT)
    return raw ? parseInt(raw, 10) || 0 : 0
  },

  setAdExecutionCount(n: number): void {
    mmkv.set(KEYS.AD_EXECUTION_COUNT, n.toString())
  },
}
