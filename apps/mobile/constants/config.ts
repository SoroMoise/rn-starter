import { getDeviceLanguage } from '@/utils/i18n'
import Constants from 'expo-constants'

const appConfig = Constants.expoConfig?.extra

export const BACKEND_CONFIG = {
  URL: appConfig?.backendUrl as string,
  API_KEY: appConfig?.backendApiKey as string,
  TIMEOUT: 10000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
}

export const DEFAULT_SETTINGS = {
  theme: 'auto' as const,
  language: getDeviceLanguage(),
  notifications: true,
  notificationQuietHoursEnabled: false,
  notificationQuietHoursStart: '22:00',
  notificationQuietHoursEnd: '08:00',
  notificationSound: true,
  notificationVibration: true,
}

export const UI_CONFIG = {
  ANIMATION_DURATION: 300, // ms
  DEBOUNCE_DELAY: 300, // ms

  MAX_AMOUNT: 999999999999,
  MIN_AMOUNT: 0.000001,

  MAX_FAVORITES: 50,

  AUTO_REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes
  PULL_TO_REFRESH_THRESHOLD: 100, // pixels
}

export const APP_URLS = {
  PRIVACY_POLICY: 'https://yourwebsite.com/privacy',
  TERMS_OF_SERVICE: 'https://yourwebsite.com/terms',
  SUPPORT_EMAIL: 'support@yourapp.com',
  WEBSITE: 'https://yourwebsite.com',
  GITHUB: 'https://github.com/yourusername/rn-starter',
}

export const APP_INFO = {
  NAME: 'RN Starter',
  VERSION: '1.0.0',
  BUILD_NUMBER: '1',
  DESCRIPTION: 'A production-ready React Native starter',
}

export const RTL_RESTART_BANNER_ENABLED: boolean = appConfig?.rtlRestartBannerEnabled !== false
