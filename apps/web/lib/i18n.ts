// EN and FR are the source of truth, as in the app: other languages come in a dedicated pass. Adding
// one is a content folder, an entry here, and its paths in routes.ts.
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
