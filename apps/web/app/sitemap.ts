import type { MetadataRoute } from 'next'
import { LOCALES } from '@/lib/i18n'
import { ROUTES, type RouteKey } from '@/lib/routes'
import { absoluteUrl, languageAlternates } from '@/lib/seo'

export const dynamic = 'force-static'

const PRIORITY: Record<RouteKey, number> = {
  home: 1,
  privacy: 0.3,
  terms: 0.3,
}

export default function sitemap(): MetadataRoute.Sitemap {
  return (Object.keys(ROUTES) as RouteKey[]).flatMap((route) =>
    LOCALES.map((locale) => ({
      url: absoluteUrl(ROUTES[route][locale]),
      changeFrequency: 'monthly' as const,
      priority: PRIORITY[route],
      alternates: { languages: languageAlternates(route) },
    }))
  )
}
