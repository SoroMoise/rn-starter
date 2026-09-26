import { HTML_LANG, type Locale } from './i18n'
import { SITE, STORE_URL } from './site'

// No aggregateRating: Google requires it to reflect real reviews, and a figure written into a
// template is one every derived site would publish before its first review. No offers either — the
// app reads its prices off the store, and a price copied here drifts from them.
export function homeJsonLd(locale: Locale): Record<string, unknown>[] {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE.name,
      url: SITE.url,
      inLanguage: HTML_LANG[locale],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'MobileApplication',
      name: SITE.name,
      operatingSystem: 'Android',
      url: SITE.url,
      installUrl: STORE_URL,
      publisher: { '@type': 'Organization', name: SITE.publisher },
    },
  ]
}
