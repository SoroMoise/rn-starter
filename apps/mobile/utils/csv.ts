import { getDecimalSeparator } from '@/utils/formatters'

// Comma-decimal locales need ';' so spreadsheets don't split numbers across columns.
export function getCsvDelimiter(locale: string): string {
  return getDecimalSeparator(locale) === ',' ? ';' : ','
}

export function csvField(value: string | number, delimiter: string = ','): string {
  const str = String(value)
  const needsQuoting = str.includes('"') || str.includes('\n') || str.includes(delimiter)
  return needsQuoting ? `"${str.replace(/"/g, '""')}"` : str
}
