import type { MetadataRoute } from 'next'
import { LOCALES } from '@/lib/i18n'
import { SCREENSHOTS } from '@/lib/images'
import { isGuide, isHub, isLegal, isTopic } from '@/lib/pageTree'
import { ROUTE_KEYS, type RouteKey } from '@/lib/routes'
import { languageAlternates } from '@/lib/seo'
import { lastModified } from '@/lib/updated'
import { absoluteUrl, ogImagePath, pageUrl } from '@/lib/url'

export const dynamic = 'force-static'

function priority(route: RouteKey): number {
  if (route === 'home') return 1
  if (isLegal(route)) return 0.3
  if (isGuide(route)) return 0.6
  if (isHub(route)) return 0.7
  if (isTopic(route)) return 0.8
  return 0.8
}

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTE_KEYS.flatMap((route) =>
    LOCALES.map((locale) => ({
      url: pageUrl({ route, locale }),
      lastModified: lastModified({ route, locale }),
      changeFrequency: 'monthly' as const,
      priority: priority(route),
      alternates: { languages: languageAlternates(route) },
      images: [
        absoluteUrl(ogImagePath({ route, locale })),
        ...(route === 'home' ? SCREENSHOTS.map((screenshot) => absoluteUrl(screenshot.src)) : []),
      ],
    }))
  )
}
