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
  // Android 16 ignores `screenOrientation` past 600 dp, so tablets, open foldables and freeform
  // windows hand the app widths its screens were never drawn for. Content is capped at that same
  // threshold and centred: below it the cap never binds and a phone is untouched.
  MAX_CONTENT_WIDTH: 600,
}

export const RTL_RESTART_BANNER_ENABLED: boolean = appConfig?.rtlRestartBannerEnabled !== false
