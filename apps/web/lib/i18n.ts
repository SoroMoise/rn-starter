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
