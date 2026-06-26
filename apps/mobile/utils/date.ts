import type { Language } from '@/types'
import type { Locale } from 'date-fns'

export const getDateFnsLocale = (language: Language): Locale => {
  const localeMap: Record<Language, () => Locale> = {
    en: () => require('date-fns/locale/en-US').enUS,
    fr: () => require('date-fns/locale/fr').fr,
    es: () => require('date-fns/locale/es').es,
    de: () => require('date-fns/locale/de').de,
    'pt-BR': () => require('date-fns/locale/pt-BR').ptBR,
    'zh-CN': () => require('date-fns/locale/zh-CN').zhCN,
    'zh-TW': () => require('date-fns/locale/zh-TW').zhTW,
    ja: () => require('date-fns/locale/ja').ja,
    ko: () => require('date-fns/locale/ko').ko,
    ar: () => require('date-fns/locale/ar').ar,
    hi: () => require('date-fns/locale/hi').hi,
    bn: () => require('date-fns/locale/bn').bn,
    ru: () => require('date-fns/locale/ru').ru,
    id: () => require('date-fns/locale/id').id,
    tr: () => require('date-fns/locale/tr').tr,
    it: () => require('date-fns/locale/it').it,
    nl: () => require('date-fns/locale/nl').nl,
    sv: () => require('date-fns/locale/sv').sv,
    pl: () => require('date-fns/locale/pl').pl,
    vi: () => require('date-fns/locale/vi').vi,
  }
  return (localeMap[language] ?? localeMap.en)()
}

export const INTL_LOCALE_MAP: Record<Language, string> = {
  en: 'en-US',
  fr: 'fr-FR',
  es: 'es-ES',
  de: 'de-DE',
  'pt-BR': 'pt-BR',
  'zh-CN': 'zh-CN',
  'zh-TW': 'zh-TW',
  ja: 'ja-JP',
  ko: 'ko-KR',
  ar: 'ar-SA',
  hi: 'hi-IN',
  bn: 'bn-BD',
  ru: 'ru-RU',
  id: 'id-ID',
  tr: 'tr-TR',
  it: 'it-IT',
  nl: 'nl-NL',
  sv: 'sv-SE',
  pl: 'pl-PL',
  vi: 'vi-VN',
}

export const getIntlLocale = (language: Language): string => {
  return INTL_LOCALE_MAP[language] || 'en-US'
}
