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

const PLACEHOLDER = /\[|example\.com/

export function hasPlaceholders(text: string): boolean {
  return PLACEHOLDER.test(text) || Object.values(SITE).some((value) => PLACEHOLDER.test(value))
}
