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
  notificationSound: true,
  notificationVibration: true,
}

export const UI_CONFIG = {
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 300,
}

export const RTL_RESTART_BANNER_ENABLED: boolean = appConfig?.rtlRestartBannerEnabled !== false
