import { mmkv } from '@/services/storage/mmkv'
import { KEYS } from '@/services/storage/keys'
import type { Language } from '@/types'
import { getDeviceLanguage } from '@/utils/i18n'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './languages/en.json'

const languageLoaders: Record<Language, () => Record<string, unknown>> = {
  en: () => en,
  fr: () => require('./languages/fr.json'),
  es: () => require('./languages/es.json'),
  de: () => require('./languages/de.json'),
  'pt-BR': () => require('./languages/pt-BR.json'),
  'zh-CN': () => require('./languages/zh-CN.json'),
  'zh-TW': () => require('./languages/zh-TW.json'),
  ja: () => require('./languages/ja.json'),
  ko: () => require('./languages/ko.json'),
  ar: () => require('./languages/ar.json'),
  hi: () => require('./languages/hi.json'),
  bn: () => require('./languages/bn.json'),
  ru: () => require('./languages/ru.json'),
  id: () => require('./languages/id.json'),
  tr: () => require('./languages/tr.json'),
  it: () => require('./languages/it.json'),
  nl: () => require('./languages/nl.json'),
  sv: () => require('./languages/sv.json'),
  pl: () => require('./languages/pl.json'),
  vi: () => require('./languages/vi.json'),
}

export function loadLanguage(lang: Language): void {
  if (i18next.hasResourceBundle(lang, 'translation')) return

  const loader = languageLoaders[lang]
  if (loader) {
    i18next.addResourceBundle(lang, 'translation', loader(), true, true)
  }
}

export function ensureLanguageLoaded(lang: string): Language {
  const isSupported = (lang as Language) in languageLoaders
  const effective = (isSupported ? lang : 'en') as Language
  loadLanguage(effective)
  return effective
}

export function getActiveLanguageFromStorage(): Language {
  try {
    const raw = mmkv.getString(KEYS.USER_SETTINGS)
    if (!raw) return getDeviceLanguage()
    const parsed = JSON.parse(raw) as { state?: { settings?: { language?: string } } }
    const lng = parsed?.state?.settings?.language
    if (typeof lng === 'string' && (lng as Language) in languageLoaders) {
      return lng as Language
    }
    return getDeviceLanguage()
  } catch {
    return getDeviceLanguage()
  }
}

const deviceLang = getDeviceLanguage()

const resources: Record<string, { translation: Record<string, unknown> }> = {
  en: { translation: en },
}

if (deviceLang !== 'en') {
  const loader = languageLoaders[deviceLang]
  if (loader) {
    resources[deviceLang] = { translation: loader() }
  }
}

// eslint-disable-next-line import/no-named-as-default-member -- i18next fluent API (.use(plugin)), not the named `use` export
i18next.use(initReactI18next).init({
  resources,
  lng: deviceLang,
  fallbackLng: 'en',

  compatibilityJSON: 'v4',

  interpolation: { escapeValue: false },

  pluralSeparator: '_',

  react: {
    useSuspense: false,
  },
})

export default i18next
