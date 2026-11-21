export const LOCALES = ['en', 'fr'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

export const HTML_LANG: Record<Locale, string> = {
  en: 'en',
  fr: 'fr',
}

export const OG_LOCALE: Record<Locale, string> = {
  en: 'en_US',
  fr: 'fr_FR',
}

export const LOCALE_LABEL: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
}

export const LOCALE_SHORT: Record<Locale, string> = {
  en: 'EN',
  fr: 'FR',
}

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function formatDate({ value, locale }: { value: string; locale: Locale }): string {
  if (!ISO_DATE.test(value)) return value
  return new Intl.DateTimeFormat(HTML_LANG[locale], { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(value)
  )
}
