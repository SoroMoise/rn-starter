// Everything the site states about the app and its publisher. scripts/setup.sh writes the name,
// the domain, the package and the support address here from the answers it writes into the app;
// the publisher and the date the legal pages take effect are yours to fill in, like the bracketed
// passages of content/*/legal.ts, and those pages print a notice until nothing is left in brackets.
export const SITE = {
  name: 'RN Starter',
  // apps/mobile/constants/legal.ts opens /privacy and /terms on this domain from every installed
  // build: the two change together, in the same commit.
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
