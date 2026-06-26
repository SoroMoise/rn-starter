import Ionicons from '@expo/vector-icons/Ionicons'
import { ComponentProps } from 'react'

export type ThemeMode = 'light' | 'dark' | 'auto'
export type Language =
  | 'en'
  | 'fr'
  | 'es'
  | 'de'
  | 'pt-BR'
  | 'zh-CN'
  | 'zh-TW'
  | 'ja'
  | 'ko'
  | 'ar'
  | 'hi'
  | 'bn'
  | 'ru'
  | 'id'
  | 'tr'
  | 'it'
  | 'nl'
  | 'sv'
  | 'pl'
  | 'vi'

export interface UserSettings {
  theme: ThemeMode
  decimals: number
  thousandSeparator: boolean
  language: Language
  notifications: boolean
  notificationQuietHoursEnabled: boolean
  notificationQuietHoursStart: string
  notificationQuietHoursEnd: string
  notificationSound: boolean
  notificationVibration: boolean
  defaultCurrencyFrom: string
  defaultCurrencyTo: string
}

export interface FormatterOptions {
  decimals: number
  useSeparator: boolean
  locale: string
}

export interface ThemeOption {
  value: ThemeMode
  label: string
  icon: ComponentProps<typeof Ionicons>['name']
  activeIcon: ComponentProps<typeof Ionicons>['name']
}
