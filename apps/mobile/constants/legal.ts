// Public pages on the app's own site: nothing secret, and the same string in every build. Routing
// them through the environment only bought the chance of shipping a build whose legal links open
// nothing — on the paywall, where both stores require them to work. apps/web serves these paths,
// and they are a contract with every build already installed: never renamed, never translated.
// scripts/setup.sh replaces the placeholder domain and address here and in apps/web/lib/site.ts.
export const APP_WEBSITE_URL = 'https://yourapp.example.com'

export const LEGAL_URLS = {
  PRIVACY_POLICY: `${APP_WEBSITE_URL}/privacy`,
  TERMS_OF_SERVICE: `${APP_WEBSITE_URL}/terms`,
  SUPPORT_EMAIL: 'mailto:support@example.com',
} as const
