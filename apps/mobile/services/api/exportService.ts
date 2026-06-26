import { getCurrencyByCode } from '@constants/currencies'
import type { ExportFormat, ExportType } from '@stores/exportPreferencesStore'
import type { Currency, ExchangeRate, HistoricalRate, Period, Statistics } from '@/types'
import type { MultiConversionResult } from '@hooks/useMultiConversion'
import { mmkv } from '@/services/storage/mmkv'
import { KEYS } from '@/services/storage/keys'
import { File } from 'expo-file-system'
import * as FileSystem from 'expo-file-system/legacy'
import * as IntentLauncher from 'expo-intent-launcher'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { Platform } from 'react-native'
import i18n from '@/i18n/service'
import { getIntlLocale } from '@/utils/date'
import { csvField, getCsvDelimiter } from '@/utils/csv'
import { formatAmount, formatRateLocalized, getDecimalSeparator } from '@/utils/formatters'
import { getCurrencyName } from '@/utils/currency'
import { useSettingsStore } from '@stores/settingsStore'
import type { Language } from '@/types/settings'

export type ConversionExportParams = {
  conversions: MultiConversionResult[]
  fromCurrency: Currency
  amount: string
  date: Date
}

export type HistoricalExportParams = {
  rates: HistoricalRate[]
  fromCurrency: string
  toCurrency: string
  period: Period
  statistics: Statistics
  date: Date
}

export type AllRatesExportParams = {
  rates: ExchangeRate
  baseCurrency: string
  date: Date
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatTime(date: Date): string {
  return date.toTimeString().split(' ')[0].slice(0, 5)
}

function buildFilename(params: {
  type: ExportType
  ext: ExportFormat
  baseCurrency: string
  toCurrency?: string
  period?: number
  date: Date
}): string {
  const d = formatDate(params.date)
  switch (params.type) {
    case 'conversion':
      return `conversion-${params.baseCurrency}-${d}.${params.ext}`
    case 'historical':
      return `historical-${params.baseCurrency}-${params.toCurrency}-${params.period}d-${d}.${params.ext}`
    case 'allRates':
      return `market-rates-${params.baseCurrency}-${d}.${params.ext}`
  }
}

const BOM = '﻿'

const RATE_EXPORT_DECIMALS = 6

interface ExportFormatContext {
  language: Language
  locale: string
  decimals: number
  useSeparator: boolean
  csvDelimiter: string
}

function exportFormatContext(): ExportFormatContext {
  const { language, decimals, thousandSeparator } = useSettingsStore.getState().settings
  const locale = getIntlLocale(language as Language)
  return {
    language: language as Language,
    locale,
    decimals,
    useSeparator: thousandSeparator,
    csvDelimiter: getCsvDelimiter(locale),
  }
}

function localizeRate(rate: number, locale: string): string {
  return formatRateLocalized({ rate, decimals: RATE_EXPORT_DECIMALS, locale })
}

function localizeAmountString(amount: string, locale: string): string {
  return amount.replace('.', getDecimalSeparator(locale))
}

function appName(): string {
  return i18n.t('common.appName')
}

export function generateConversionCSV({
  conversions,
  fromCurrency,
  amount,
  date,
}: ConversionExportParams): string {
  const { locale, decimals, csvDelimiter } = exportFormatContext()
  const dateStr = formatDate(date)
  const timeStr = formatTime(date)
  const toField = (value: string | number) => csvField(value, csvDelimiter)
  const header = [
    i18n.t('export.file.colDate'),
    i18n.t('export.file.colTime'),
    i18n.t('export.file.colFrom'),
    i18n.t('export.file.colAmount'),
    i18n.t('export.file.colTo'),
    i18n.t('export.file.colRate'),
    i18n.t('export.file.colResult'),
  ]
    .map(toField)
    .join(csvDelimiter)
  const localizedAmount = localizeAmountString(amount, locale)
  const rows = conversions.map((c) =>
    [
      dateStr,
      timeStr,
      fromCurrency.code,
      localizedAmount,
      c.code,
      localizeRate(c.rate, locale),
      formatRateLocalized({ rate: c.result, decimals, locale }),
    ]
      .map(toField)
      .join(csvDelimiter)
  )
  return BOM + [header, ...rows].join('\n')
}

export function generateHistoricalCSV({
  rates,
  fromCurrency,
  toCurrency,
}: HistoricalExportParams): string {
  const { locale, csvDelimiter } = exportFormatContext()
  const toField = (value: string | number) => csvField(value, csvDelimiter)
  const header = [i18n.t('export.file.colDate'), `${fromCurrency}/${toCurrency}`]
    .map(toField)
    .join(csvDelimiter)
  const rows = rates.map((r) =>
    [r.date, localizeRate(r.rate, locale)].map(toField).join(csvDelimiter)
  )
  return BOM + [header, ...rows].join('\n')
}

export function generateAllRatesCSV({ rates, baseCurrency, date }: AllRatesExportParams): string {
  const { language, locale, csvDelimiter } = exportFormatContext()
  const dateStr = formatDate(date)
  const sortedCodes = Object.keys(rates.rates).sort()
  const toField = (value: string | number) => csvField(value, csvDelimiter)
  const header = [
    i18n.t('export.file.colBase'),
    i18n.t('export.file.colCode'),
    i18n.t('export.file.colName'),
    i18n.t('export.file.colRate'),
    i18n.t('export.file.colDate'),
  ]
    .map(toField)
    .join(csvDelimiter)
  const rows = sortedCodes.map((code) =>
    [
      baseCurrency,
      code,
      getCurrencyName(getCurrencyByCode(code), language),
      localizeRate(rates.rates[code], locale),
      dateStr,
    ]
      .map(toField)
      .join(csvDelimiter)
  )
  return BOM + [header, ...rows].join('\n')
}

function buildHistoricalSVG(rates: HistoricalRate[]): string {
  if (rates.length < 2) return ''
  const values = rates.map((r) => r.rate)
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const range = maxVal - minVal || 1
  const W = 560
  const H = 100
  const padTop = 8
  const padBottom = 8

  const toXY = (i: number, v: number) => {
    const x = (i / (rates.length - 1)) * W
    const y = H - padBottom - ((v - minVal) / range) * (H - padTop - padBottom)
    return { x, y }
  }

  const linePoints = rates
    .map((r, i) => {
      const { x, y } = toXY(i, r.rate)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const firstPt = toXY(0, rates[0].rate)
  const lastPt = toXY(rates.length - 1, rates[rates.length - 1].rate)
  const areaPath =
    `M${firstPt.x.toFixed(1)},${H} ` +
    rates
      .map((r, i) => {
        const p = toXY(i, r.rate)
        return `L${p.x.toFixed(1)},${p.y.toFixed(1)}`
      })
      .join(' ') +
    ` L${lastPt.x.toFixed(1)},${H} Z`

  return `<svg width="100%" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="display:block">
    <defs>
      <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#059669" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#059669" stop-opacity="0.02"/>
      </linearGradient>
    </defs>
    <path d="${areaPath}" fill="url(#cg)"/>
    <polyline points="${linePoints}" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`
}

const PDF_BASE_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #111827; }
  .header { padding: 28px 32px 22px; color: white; }
  .header-meta { font-size: 13px; opacity: 0.8; margin-bottom: 8px; }
  .header-title { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
  .header-subtitle { font-size: 13px; opacity: 0.7; margin-top: 4px; }
  .body { padding: 20px 28px; }
  table { width: 100%; border-collapse: collapse; }
  thead tr { border-bottom: 2px solid #f3f4f6; }
  th { text-align: left; font-size: 11px; color: #9ca3af; font-weight: 600; padding: 0 0 8px; text-transform: uppercase; letter-spacing: 0.5px; }
  th.right, td.right { text-align: right; }
  tbody tr { border-bottom: 1px solid #f9fafb; }
  td { padding: 10px 0; font-size: 13px; color: #374151; }
  td.bold { font-size: 14px; font-weight: 700; color: #111827; }
  td.muted { font-size: 12px; color: #6b7280; }
  .footer { text-align: center; font-size: 10px; color: #d1d5db; padding: 12px 0 20px; }
  .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 18px; }
  .stat-card { border-radius: 10px; padding: 12px 16px; border: 1px solid; }
  .stat-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; }
  .stat-value { font-size: 20px; font-weight: 800; margin-top: 4px; }
  .chart-label { font-size: 11px; color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 8px; }
`

function buildConversionHTML({
  conversions,
  fromCurrency,
  amount,
  date,
}: ConversionExportParams): string {
  const dateStr = `${formatDate(date)} · ${formatTime(date)}`
  const { language, locale, decimals, useSeparator } = exportFormatContext()
  const rows = conversions
    .map(
      (c) => `
    <tr>
      <td>${c.currency.flag} ${getCurrencyName(c.currency, language)} (${c.code})</td>
      <td class="muted right">${localizeRate(c.rate, locale)}</td>
      <td class="bold right">${formatAmount({ amount: c.result, decimals, useSeparator, locale })} ${c.currency.symbol}</td>
    </tr>`
    )
    .join('')

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      ${PDF_BASE_STYLES}
      .header { background: linear-gradient(135deg, #7c3aed, #4f46e5); }
    </style>
  </head><body>
    <div class="header">
      <div class="header-meta">${appName()} · ${dateStr}</div>
      <div class="header-title">${localizeAmountString(amount, locale)} <span style="opacity:0.7;font-size:20px">${fromCurrency.code}</span></div>
      <div class="header-subtitle">${getCurrencyName(fromCurrency, language)} · ${i18n.t('export.file.currenciesCount', { count: conversions.length })}</div>
    </div>
    <div class="body">
      <table>
        <thead><tr><th>${i18n.t('export.file.colCurrency')}</th><th class="right">${i18n.t('export.file.colRate')}</th><th class="right">${i18n.t('export.file.colResult')}</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="footer">${i18n.t('export.pdfFooter')}</div>
  </body></html>`
}

function buildHistoricalHTML({
  rates,
  fromCurrency,
  toCurrency,
  period,
  statistics,
  date,
}: HistoricalExportParams): string {
  const dateStr = formatDate(date)
  const { locale } = exportFormatContext()
  const svg = buildHistoricalSVG(rates)
  const variation =
    statistics.variation >= 0
      ? `+${statistics.variation.toFixed(2)}%`
      : `${statistics.variation.toFixed(2)}%`
  const rows = rates
    .map(
      (r) => `
    <tr>
      <td class="muted">${r.date}</td>
      <td class="bold right">${localizeRate(r.rate, locale)}</td>
    </tr>`
    )
    .join('')

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      ${PDF_BASE_STYLES}
      .header { background: linear-gradient(135deg, #059669, #0284c7); }
    </style>
  </head><body>
    <div class="header">
      <div class="header-meta">${appName()} · ${i18n.t('export.file.historicalReport')}</div>
      <div class="header-title">${fromCurrency} / ${toCurrency}</div>
      <div class="header-subtitle">${i18n.t('export.file.lastDays', { count: period })} · ${dateStr}</div>
    </div>
    <div class="body">
      <div class="stat-grid">
        <div class="stat-card" style="background:#f0fdf4;border-color:#bbf7d0">
          <div class="stat-label" style="color:#059669">${i18n.t('export.file.maximum')}</div>
          <div class="stat-value" style="color:#065f46">${formatRateLocalized({ rate: statistics.max, decimals: 6, locale })}</div>
        </div>
        <div class="stat-card" style="background:#fef2f2;border-color:#fecaca">
          <div class="stat-label" style="color:#dc2626">${i18n.t('export.file.minimum')}</div>
          <div class="stat-value" style="color:#7f1d1d">${formatRateLocalized({ rate: statistics.min, decimals: 6, locale })}</div>
        </div>
        <div class="stat-card" style="background:#eff6ff;border-color:#bfdbfe">
          <div class="stat-label" style="color:#2563eb">${i18n.t('export.file.average')}</div>
          <div class="stat-value" style="color:#1e3a8a">${formatRateLocalized({ rate: statistics.average, decimals: 6, locale })}</div>
        </div>
        <div class="stat-card" style="background:#faf5ff;border-color:#e9d5ff">
          <div class="stat-label" style="color:#7c3aed">${i18n.t('export.file.variation')}</div>
          <div class="stat-value" style="color:#4c1d95">${variation}</div>
        </div>
      </div>
      ${svg ? `<div class="chart-label">${i18n.t('export.file.rateEvolution')}</div>${svg}<br>` : ''}
      <table>
        <thead><tr><th>${i18n.t('export.file.colDate')}</th><th class="right">${fromCurrency}/${toCurrency}</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="footer">${i18n.t('export.pdfFooter')}</div>
  </body></html>`
}

function buildAllRatesHTML({ rates, baseCurrency, date }: AllRatesExportParams): string {
  const dateStr = `${formatDate(date)} · ${formatTime(date)} UTC`
  const { language, locale } = exportFormatContext()
  const sortedCodes = Object.keys(rates.rates).sort()
  const rows = sortedCodes
    .map((code) => {
      const currency = getCurrencyByCode(code)
      return `<tr>
      <td style="font-weight:700">${code}</td>
      <td class="muted">${getCurrencyName(currency, language)}</td>
      <td class="bold right">${localizeRate(rates.rates[code], locale)}</td>
    </tr>`
    })
    .join('')

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      ${PDF_BASE_STYLES}
      .header { background: linear-gradient(135deg, #0f172a, #1e3a8a); }
    </style>
  </head><body>
    <div class="header">
      <div class="header-meta">${appName()} · ${i18n.t('export.file.marketRates')}</div>
      <div class="header-title">${i18n.t('export.file.fromBase', { base: baseCurrency })}</div>
      <div class="header-subtitle">${i18n.t('export.file.currenciesCount', { count: sortedCodes.length })} · ${dateStr}</div>
    </div>
    <div class="body">
      <table>
        <thead><tr><th>${i18n.t('export.file.colCode')}</th><th>${i18n.t('export.file.colCurrency')}</th><th class="right">1 ${baseCurrency} =</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="footer">${i18n.t('export.pdfFooter')}</div>
  </body></html>`
}

async function getOrRequestDownloadsUri(): Promise<string> {
  const stored = mmkv.getString(KEYS.EXPORT_DOWNLOADS_URI) ?? null
  if (stored) {
    try {
      await FileSystem.StorageAccessFramework.readDirectoryAsync(stored)
      return stored
    } catch {
      // permission expired, re-request
    }
  }
  const result = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(
    'content://com.android.externalstorage.documents/tree/primary%3ADownload'
  )
  if (!result.granted) throw new Error('downloads_permission_denied')
  mmkv.set(KEYS.EXPORT_DOWNLOADS_URI, result.directoryUri)
  return result.directoryUri
}

async function saveAndOpenFile(params: {
  content: string
  filename: string
  mimeType: string
  encoding?: FileSystem.EncodingType
}): Promise<void> {
  const { content, filename, mimeType, encoding = FileSystem.EncodingType.UTF8 } = params
  const uti =
    mimeType === 'application/pdf' ? 'com.adobe.pdf' : 'public.comma-separated-values-text'

  if (Platform.OS === 'android') {
    const dirUri = await getOrRequestDownloadsUri()
    const contentUri = await FileSystem.StorageAccessFramework.createFileAsync(
      dirUri,
      filename,
      mimeType
    )
    await FileSystem.writeAsStringAsync(contentUri, content, { encoding })
    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: contentUri,
      type: mimeType,
      flags: 1,
    })
  } else {
    const fileUri = FileSystem.documentDirectory + filename
    await FileSystem.writeAsStringAsync(fileUri, content, { encoding })
    await Sharing.shareAsync(fileUri, { mimeType, dialogTitle: filename, UTI: uti })
  }
}

async function writeCSVAndOpen(params: { content: string; filename: string }): Promise<void> {
  await saveAndOpenFile({
    content: params.content,
    filename: params.filename,
    mimeType: 'text/csv',
  })
}

export async function exportConversionCSV(params: ConversionExportParams): Promise<void> {
  const content = generateConversionCSV(params)
  const filename = buildFilename({
    type: 'conversion',
    ext: 'csv',
    baseCurrency: params.fromCurrency.code,
    date: params.date,
  })
  await writeCSVAndOpen({ content, filename })
}

export async function exportHistoricalCSV(params: HistoricalExportParams): Promise<void> {
  const content = generateHistoricalCSV(params)
  const filename = buildFilename({
    type: 'historical',
    ext: 'csv',
    baseCurrency: params.fromCurrency,
    toCurrency: params.toCurrency,
    period: params.period,
    date: params.date,
  })
  await writeCSVAndOpen({ content, filename })
}

export async function exportAllRatesCSV(params: AllRatesExportParams): Promise<void> {
  const content = generateAllRatesCSV(params)
  const filename = buildFilename({
    type: 'allRates',
    ext: 'csv',
    baseCurrency: params.baseCurrency,
    date: params.date,
  })
  await writeCSVAndOpen({ content, filename })
}

async function printPDFAndOpen(params: { html: string; filename: string }): Promise<void> {
  const { uri: tempUri } = await Print.printToFileAsync({ html: params.html, base64: false })
  try {
    if (Platform.OS === 'android') {
      const base64 = await FileSystem.readAsStringAsync(tempUri, {
        encoding: FileSystem.EncodingType.Base64,
      })
      await saveAndOpenFile({
        content: base64,
        filename: params.filename,
        mimeType: 'application/pdf',
        encoding: FileSystem.EncodingType.Base64,
      })
    } else {
      const fileUri = FileSystem.documentDirectory + params.filename
      await FileSystem.copyAsync({ from: tempUri, to: fileUri })
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/pdf',
        dialogTitle: params.filename,
        UTI: 'com.adobe.pdf',
      })
    }
  } finally {
    await new File(tempUri).delete()
  }
}

export async function exportConversionPDF(params: ConversionExportParams): Promise<void> {
  const html = buildConversionHTML(params)
  const filename = buildFilename({
    type: 'conversion',
    ext: 'pdf',
    baseCurrency: params.fromCurrency.code,
    date: params.date,
  })
  await printPDFAndOpen({ html, filename })
}

export async function exportHistoricalPDF(params: HistoricalExportParams): Promise<void> {
  const html = buildHistoricalHTML(params)
  const filename = buildFilename({
    type: 'historical',
    ext: 'pdf',
    baseCurrency: params.fromCurrency,
    toCurrency: params.toCurrency,
    period: params.period,
    date: params.date,
  })
  await printPDFAndOpen({ html, filename })
}

export async function exportAllRatesPDF(params: AllRatesExportParams): Promise<void> {
  const html = buildAllRatesHTML(params)
  const filename = buildFilename({
    type: 'allRates',
    ext: 'pdf',
    baseCurrency: params.baseCurrency,
    date: params.date,
  })
  await printPDFAndOpen({ html, filename })
}
