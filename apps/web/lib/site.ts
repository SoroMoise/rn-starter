export const SITE = {
  name: 'RN Starter',
  storeTitle: '[Google Play title, up to 30 characters]',
  url: 'https://yourapp.example.com',
  androidPackage: 'com.yourcompany.rnstarter',
  supportEmail: 'support@example.com',
  publisher: '[Publisher name]',
  publisherSite: '[https://publisher.example.com]',
  legalUpdated: '[YYYY-MM-DD]',
  applicationCategory: 'UtilitiesApplication',
} as const

export const STORE_URL = `https://play.google.com/store/apps/details?id=${SITE.androidPackage}`

const PLACEHOLDER = /\[[^\]]+\]|example\.com/

export function isPlaceholder(text: string): boolean {
  return PLACEHOLDER.test(text)
}

export const SITE_READY = !Object.values(SITE).some(isPlaceholder)

export function hasPlaceholders(text: string): boolean {
  return isPlaceholder(text) || !SITE_READY
}
