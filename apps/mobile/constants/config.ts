import { Period } from '@/types'
import { getDeviceCurrencies, getDeviceLanguage } from '@/utils/i18n'
import Constants from 'expo-constants'

const appConfig = Constants.expoConfig?.extra

export const API_CONFIG = {
  BASE_URL: 'https://v6.exchangerate-api.com/v6',
  API_KEY: appConfig?.apiKey,

  TIMEOUT: 10000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,

  BATCH_SIZE: 100,
  BATCH_DELAY: 10,
}

export const CACHE_CONFIG = {
  // 30s: prevents double-fetch when navigating quickly between screens
  RATES_DEBOUNCE_DURATION: 30 * 1000,
  // 30min: aligned with backend KV TTL (3600s) — triggers silent background refresh
  RATES_BACKGROUND_REFRESH: 30 * 60 * 1000,
  HISTORICAL_CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  OLD_DATA_WARNING_THRESHOLD: 7 * 24 * 60 * 60 * 1000, // 7 days

  STORAGE_KEYS: {
    RATES: 'currency_rates',
    SETTINGS: 'user_settings',
    LAST_UPDATE: 'last_rates_update',
    ONBOARDING_SEEN: 'onboarding_seen',
    HAS_PURCHASED_PREMIUM: 'has_purchased_premium',
    QUICK_CONVERSIONS: 'quick_conversions',
    OFFLINE_RATES: 'offline_rates',
    INITIAL_DATA_LOADED: 'initial_data_loaded',
    PULL_TO_REFRESH_TUTORIAL_SEEN: 'pull_to_refresh_tutorial_seen',
  },
}

export const BACKEND_CONFIG = {
  URL: appConfig?.backendUrl as string,
  API_KEY: appConfig?.backendApiKey as string,
  TIMEOUT: 10000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
}

const deviceCurrencies = getDeviceCurrencies()

export const DEFAULT_SETTINGS = {
  theme: 'auto' as const,
  decimals: 3,
  thousandSeparator: true,
  language: getDeviceLanguage(),
  notifications: true,
  notificationQuietHoursEnabled: false,
  notificationQuietHoursStart: '22:00',
  notificationQuietHoursEnd: '08:00',
  notificationSound: true,
  notificationVibration: true,
  defaultCurrencyFrom: deviceCurrencies.from,
  defaultCurrencyTo: deviceCurrencies.to,
}

export const UI_CONFIG = {
  ANIMATION_DURATION: 300, // ms
  DEBOUNCE_DELAY: 300, // ms

  MIN_DECIMALS: 0,
  MAX_DECIMALS: 6,

  MAX_AMOUNT: 999999999999,
  MIN_AMOUNT: 0.000001,

  DEFAULT_CHART_PERIOD: 7, // days
  CHART_PERIODS: [7, 30, 90, 270, 365],

  MAX_FAVORITES: 50,

  AUTO_REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes
  PULL_TO_REFRESH_THRESHOLD: 100, // pixels
}

export const APP_URLS = {
  PRIVACY_POLICY: 'https://yourwebsite.com/privacy',
  TERMS_OF_SERVICE: 'https://yourwebsite.com/terms',
  SUPPORT_EMAIL: 'support@yourapp.com',
  WEBSITE: 'https://yourwebsite.com',
  GITHUB: 'https://github.com/yourusername/all-currency-converter',
}

export const QUICK_CONVERSIONS_CONFIG = {
  DEFAULT_QUICK_CURRENCIES: ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'THB'],
  MIN_QUICK_CURRENCIES: 3,
}

export const OFFLINE_CONFIG = {
  PRELOAD_CURRENCIES: ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD'],
  MAX_PRELOAD_RETRIES: 2,
  PRELOAD_BATCH_DELAY: 500,
}

export const APP_INFO = {
  NAME: 'All Currency Converter',
  VERSION: '1.0.0',
  BUILD_NUMBER: '1',
  DESCRIPTION: 'Convert 170+ currencies with real-time rates',
}

export const RTL_RESTART_BANNER_ENABLED: boolean = appConfig?.rtlRestartBannerEnabled !== false

export const PERIODS: Period[] = [7, 30, 90, 270, 365]
