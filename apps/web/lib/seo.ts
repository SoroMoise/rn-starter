import type { Metadata } from 'next'
import { DEFAULT_LOCALE, HTML_LANG, LOCALES, OG_LOCALE, type Locale } from './i18n'
import { ROUTES, type RouteKey } from './routes'
import { SITE } from './site'

export function absoluteUrl(path: string): string {
  return path === '/' ? SITE.url : `${SITE.url}${path}`
}

// hreflang only counts when it is reciprocal and self-referencing: every locale's page lists all of
// them, itself included, plus the x-default a crawler falls back to. The head tags and the sitemap
// both read this, so the two declarations cannot contradict each other.
export function languageAlternates(route: RouteKey): Record<string, string> {
  const alternates: Record<string, string> = {}
  for (const locale of LOCALES) alternates[HTML_LANG[locale]] = absoluteUrl(ROUTES[route][locale])
  alternates['x-default'] = absoluteUrl(ROUTES[route][DEFAULT_LOCALE])
  return alternates
}

export function buildMetadata({
  locale,
  route,
  title,
  description,
}: {
  locale: Locale
  route: RouteKey
  title: string
  description: string
}): Metadata {
  const canonical = absoluteUrl(ROUTES[route][locale])

  return {
    metadataBase: new URL(SITE.url),
    title: { absolute: title },
    description,
    alternates: { canonical, languages: languageAlternates(route) },
    openGraph: {
      type: 'website',
      url: canonical,
      siteName: SITE.name,
      title,
      description,
      locale: OG_LOCALE[locale],
      alternateLocale: LOCALES.filter((other) => other !== locale).map((other) => OG_LOCALE[other]),
    },
    twitter: { card: 'summary', title, description },
  }
}
