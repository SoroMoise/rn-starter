import { HTML_LANG, type Locale } from './i18n'
import { SITE, STORE_URL } from './site'

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
