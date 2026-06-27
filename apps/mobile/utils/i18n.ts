import { Language } from '@/types'
import { getLocales } from 'expo-localization'

const SUPPORTED_LANGUAGES: Language[] = [
  'en',
  'fr',
  'es',
  'de',
  'pt-BR',
  'zh-CN',
  'zh-TW',
  'ja',
  'ko',
  'ar',
  'hi',
  'bn',
  'ru',
  'id',
  'tr',
  'it',
  'nl',
  'sv',
  'pl',
  'vi',
]

const LANGUAGE_CODE_MAP: Record<string, Language> = {
  pt: 'pt-BR',
  zh: 'zh-CN',
}

export const getDeviceLanguage = (): Language => {
  const locale = getLocales()[0]
  const languageTag = locale?.languageTag || 'en'
  const languageCode = locale?.languageCode || 'en'

  if (SUPPORTED_LANGUAGES.includes(languageTag as Language)) {
    return languageTag as Language
  }

  if (SUPPORTED_LANGUAGES.includes(languageCode as Language)) {
    return languageCode as Language
  }

  if (LANGUAGE_CODE_MAP[languageCode]) {
    return LANGUAGE_CODE_MAP[languageCode]
  }

  return 'en'
}
