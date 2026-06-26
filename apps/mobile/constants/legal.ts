import Constants from 'expo-constants'

const venv = Constants.expoConfig?.extra

export const LEGAL_URLS = {
  PRIVACY_POLICY: venv?.legal?.privacyPolicyUrl,
  TERMS_OF_SERVICE: venv?.legal?.termsOfServiceUrl,
  LICENSES: venv?.legal?.licensesUrl,
  SUPPORT_EMAIL: venv?.legal?.supportEmail,
}

export function getAppWebsiteUrl(): string | undefined {
  return venv?.websiteUrl
}

export const STORE_URLS = {
  IOS: venv?.store?.ios,
  ANDROID: venv?.store?.android,
}
