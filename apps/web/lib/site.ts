export const SITE = {
  name: 'RN Starter',
  url: 'https://yourapp.example.com',
  androidPackage: 'com.yourcompany.rnstarter',
  supportEmail: 'support@example.com',
  publisher: '[Publisher name]',
  legalUpdated: '[YYYY-MM-DD]',
} as const

export const STORE_URL = `https://play.google.com/store/apps/details?id=${SITE.androidPackage}`

const PLACEHOLDER = /\[[^\]]+\]|example\.com/

function textValues(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(textValues)
  if (value !== null && typeof value === 'object') return Object.values(value).flatMap(textValues)
  return []
}

export function hasPlaceholders(content: object): boolean {
  return [...textValues(content), ...Object.values(SITE)].some((text) => PLACEHOLDER.test(text))
}
