import type { Language } from '@/types'

export const RTL_LANGUAGES: Language[] = ['ar']

export const isRTLLanguage = (lang: Language): boolean => RTL_LANGUAGES.includes(lang)
