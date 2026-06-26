import type { Currency } from '@/types'
import { FormatterOptions } from '@/types'

export interface FormatAmountParams {
  amount: number
  decimals: number
  useSeparator: boolean
  locale?: string
}

export function formatAmount({
  amount,
  decimals,
  useSeparator,
  locale = 'en-US',
}: FormatAmountParams): string {
  if (isNaN(amount)) return '0'

  return amount.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: useSeparator,
  })
}

export interface FormatCurrencyParams {
  amount: number
  currency: Currency
  options: FormatterOptions
}

export function formatCurrency({ amount, currency, options }: FormatCurrencyParams): string {
  const formattedAmount = formatAmount({
    amount,
    decimals: options.decimals,
    useSeparator: options.useSeparator,
    locale: options.locale,
  })

  return `${currency.symbol} ${formattedAmount}`
}

export function formatRate(rate: number, decimals: number = 4): string {
  return rate.toFixed(decimals)
}

export interface FormatRateLocalizedParams {
  rate: number
  decimals: number
  locale: string
}

export function formatRateLocalized({ rate, decimals, locale }: FormatRateLocalizedParams): string {
  if (!Number.isFinite(rate)) return '0'
  return rate.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: false,
  })
}

// Rate alerts target a specific rate the user types at fine precision, so they
// share a single floor (independent of the user's amount-oriented `decimals`)
// to keep the value entered identical to the value shown everywhere it appears.
export const ALERT_RATE_DECIMALS = 4

export function formatAlertRate({ rate, decimals, locale }: FormatRateLocalizedParams): string {
  return formatRateLocalized({ rate, decimals: Math.max(decimals, ALERT_RATE_DECIMALS), locale })
}

export function formatPercentage(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}%`
}

export function getDecimalSeparator(locale: string): string {
  return (1.1).toLocaleString(locale).charAt(1)
}

export interface FormatDisplayOptions {
  locale: string
  useSeparator: boolean
}

export function formatRawNumberForDisplay(rawValue: string, options: FormatDisplayOptions): string {
  const { locale, useSeparator } = options
  if (!rawValue || rawValue === '0') return '0'

  const hasTrailingDecimal = rawValue.endsWith('.')
  const numStr = hasTrailingDecimal ? rawValue.slice(0, -1) : rawValue

  if (!/^\d+(\.\d*)?$/.test(numStr)) return rawValue

  const num = parseFloat(numStr)
  if (isNaN(num)) return rawValue

  const dotIndex = numStr.indexOf('.')
  const decimalDigits = dotIndex >= 0 ? numStr.length - dotIndex - 1 : 0

  const formatted = num.toLocaleString(locale, {
    minimumFractionDigits: decimalDigits,
    maximumFractionDigits: decimalDigits,
    useGrouping: useSeparator,
  })

  return hasTrailingDecimal ? formatted + getDecimalSeparator(locale) : formatted
}

export function formatExpressionForDisplay(expr: string, options: FormatDisplayOptions): string {
  return expr.replace(/[\d.]+/g, (match) => formatRawNumberForDisplay(match, options))
}

const CURSOR_OPERATOR_SET = new Set(['+', '\u2212', '\u00D7', '\u00F7'])

export interface CursorMapping {
  formatted: string
  rawToFmt: number[]
  fmtToRaw: number[]
}

/**
 * Formats a raw calculator expression for display and builds bidirectional
 * cursor position mappings between raw and formatted text.
 *
 * Handles thousand separators, locale-specific decimal separators,
 * and spaces around operators.
 */
export function formatExpressionWithCursorMap(
  expr: string,
  options: FormatDisplayOptions
): CursorMapping {
  if (!expr) {
    return { formatted: '0', rawToFmt: [1], fmtToRaw: [0, 0] }
  }

  const decimalSep = getDecimalSeparator(options.locale)

  const segments: { raw: string; formatted: string }[] = []
  let i = 0
  while (i < expr.length) {
    if (CURSOR_OPERATOR_SET.has(expr[i])) {
      segments.push({ raw: expr[i], formatted: ` ${expr[i]} ` })
      i++
    } else if (/[\d.]/.test(expr[i])) {
      const start = i
      while (i < expr.length && /[\d.]/.test(expr[i])) i++
      const numStr = expr.slice(start, i)
      segments.push({
        raw: numStr,
        formatted: formatRawNumberForDisplay(numStr, options),
      })
    } else {
      segments.push({ raw: expr[i], formatted: expr[i] })
      i++
    }
  }

  let formatted = ''
  const rawToFmt: number[] = [0]
  const fmtToRaw: number[] = [0]
  let rawOffset = 0

  for (const seg of segments) {
    let ri = 0
    let fi = 0
    while (fi < seg.formatted.length) {
      const rawCh = ri < seg.raw.length ? seg.raw[ri] : null
      const fmtCh = seg.formatted[fi]
      const isMatch = rawCh !== null && (fmtCh === rawCh || (rawCh === '.' && fmtCh === decimalSep))

      if (isMatch) {
        formatted += fmtCh
        ri++
        fi++
        rawToFmt.push(formatted.length)
        fmtToRaw.push(rawOffset + ri)
      } else {
        formatted += fmtCh
        fi++
        fmtToRaw.push(rawOffset + ri)
      }
    }
    rawOffset += seg.raw.length
  }

  // Snap past formatting-only characters so the caret never sits directly before a separator.
  for (let r = 0; r < rawToFmt.length; r++) {
    let f = rawToFmt[r]
    while (f < formatted.length && !isExprChar(formatted[f], decimalSep)) {
      f++
    }
    rawToFmt[r] = f
  }

  return { formatted, rawToFmt, fmtToRaw }
}

function isExprChar(ch: string, decimalSep: string): boolean {
  return /\d/.test(ch) || ch === decimalSep || CURSOR_OPERATOR_SET.has(ch)
}

export interface ValidateAmountParams {
  amount: number
  min?: number
  max?: number
}

export function isValidAmountValue({
  amount,
  min = 0,
  max = Infinity,
}: ValidateAmountParams): boolean {
  return !isNaN(amount) && amount >= min && amount <= max && isFinite(amount)
}
