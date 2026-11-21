import type { Metadata } from 'next'
import { DEFAULT_LOCALE, HTML_LANG, LOCALES, OG_LOCALE, type Locale } from './i18n'
import { feedPath, type RouteKey } from './routes'
import { SITE, SITE_READY } from './site'
import { absoluteUrl, ogImagePath, pageUrl } from './url'

export function languageAlternates(route: RouteKey): Record<string, string> {
  const alternates: Record<string, string> = {}
  for (const locale of LOCALES) alternates[HTML_LANG[locale]] = pageUrl({ route, locale })
  alternates['x-default'] = pageUrl({ route, locale: DEFAULT_LOCALE })
  return alternates
}

export function buildMetadata({
  locale,
  route,
  title,
  description,
  article,
}: {
  locale: Locale
  route: RouteKey
  title: string
  description: string
  article?: { published: string; updated: string }
}): Metadata {
  const canonical = pageUrl({ route, locale })
  const image = { url: ogImagePath({ route, locale }), width: 1200, height: 630, alt: title }

  return {
    metadataBase: new URL(SITE.url),
    title: { absolute: title },
    description,
    applicationName: SITE.name,
    alternates: {
      canonical,
      languages: languageAlternates(route),
      types: { 'application/rss+xml': absoluteUrl(feedPath(locale)) },
    },
    robots: SITE_READY
      ? {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
        }
      : { index: false, follow: false },
    openGraph: {
      type: article ? 'article' : 'website',
      url: canonical,
      siteName: SITE.name,
      title,
      description,
      locale: OG_LOCALE[locale],
      alternateLocale: LOCALES.filter((other) => other !== locale).map((other) => OG_LOCALE[other]),
      images: [image],
      ...(article
        ? {
            publishedTime: article.published,
            modifiedTime: article.updated,
            authors: [SITE.publisher],
          }
        : {}),
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
    formatDetection: { telephone: false, address: false, email: false },
  }
}
