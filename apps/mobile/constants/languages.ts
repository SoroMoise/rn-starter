import type { Language } from '@/types'

export interface LanguageConfig {
  code: Language
  nativeName: string
  flag: string
}

export const LANGUAGES: LanguageConfig[] = [
  {
    code: 'en',
    nativeName: 'English',
    flag: '🇬🇧',
  },
  {
    code: 'fr',
    nativeName: 'Français',
    flag: '🇫🇷',
  },
  {
    code: 'es',
    nativeName: 'Español',
    flag: '🇪🇸',
  },
  {
    code: 'de',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
  },
  {
    code: 'pt-BR',
    nativeName: 'Português (Brasil)',
    flag: '🇧🇷',
  },
  {
    code: 'zh-CN',
    nativeName: '简体中文',
    flag: '🇨🇳',
  },
  {
    code: 'zh-TW',
    nativeName: '繁體中文',
    flag: '🇹🇼',
  },
  {
    code: 'ja',
    nativeName: '日本語',
    flag: '🇯🇵',
  },
  {
    code: 'ko',
    nativeName: '한국어',
    flag: '🇰🇷',
  },
  {
    code: 'ar',
    nativeName: 'العربية',
    flag: '🇸🇦',
  },
  {
    code: 'hi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
  },
  {
    code: 'bn',
    nativeName: 'বাংলা',
    flag: '🇧🇩',
  },
  {
    code: 'ru',
    nativeName: 'Русский',
    flag: '🇷🇺',
  },
  {
    code: 'id',
    nativeName: 'Bahasa Indonesia',
    flag: '🇮🇩',
  },
  {
    code: 'tr',
    nativeName: 'Türkçe',
    flag: '🇹🇷',
  },
  {
    code: 'it',
    nativeName: 'Italiano',
    flag: '🇮🇹',
  },
  {
    code: 'nl',
    nativeName: 'Nederlands',
    flag: '🇳🇱',
  },
  {
    code: 'sv',
    nativeName: 'Svenska',
    flag: '🇸🇪',
  },
  {
    code: 'pl',
    nativeName: 'Polski',
    flag: '🇵🇱',
  },
  {
    code: 'vi',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
  },
]

export const getLanguageByCode = (code: Language): LanguageConfig | undefined => {
  return LANGUAGES.find((lang) => lang.code === code)
}

export const getLanguageName = (code: Language): string => {
  const language = getLanguageByCode(code)
  if (!language) return code
  return language.nativeName
}
