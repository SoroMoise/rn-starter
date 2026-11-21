import type { Locale } from './i18n'

export const ROUTES = {
  home: { en: '/', fr: '/fr' },
  features: { en: '/features', fr: '/fr/fonctionnalites' },
  pricing: { en: '/pricing', fr: '/fr/tarifs' },
  faq: { en: '/faq', fr: '/fr/faq' },
  about: { en: '/about', fr: '/fr/a-propos' },
  useCases: { en: '/use-cases', fr: '/fr/cas-usage' },
  useCaseExample: { en: '/use-cases/example', fr: '/fr/cas-usage/exemple' },
  guides: { en: '/guides', fr: '/fr/guides' },
  guideExample: { en: '/guides/example-guide', fr: '/fr/guides/exemple-de-guide' },
  privacy: { en: '/privacy', fr: '/fr/privacy' },
  terms: { en: '/terms', fr: '/fr/terms' },
} as const satisfies Record<string, Record<Locale, string>>

export type RouteKey = keyof typeof ROUTES

export const ROUTE_KEYS = Object.keys(ROUTES) as RouteKey[]

export function isRouteKey(value: string): value is RouteKey {
  return Object.hasOwn(ROUTES, value)
}

const LOCALE_PREFIX: Record<Locale, string> = { en: '', fr: '/fr' }

function slugOf({ key, locale }: { key: RouteKey; locale: Locale }): string[] {
  return ROUTES[key][locale].slice(LOCALE_PREFIX[locale].length).split('/').filter(Boolean)
}

export function staticParams(locale: Locale): { slug: string[] | undefined }[] {
  return ROUTE_KEYS.map((key) => {
    const slug = slugOf({ key, locale })
    return { slug: slug.length ? slug : undefined }
  })
}

export function routeForSlug({
  locale,
  slug,
}: {
  locale: Locale
  slug: string[] | undefined
}): RouteKey | undefined {
  const wanted = (slug ?? []).join('/')
  return ROUTE_KEYS.find((key) => slugOf({ key, locale }).join('/') === wanted)
}

export function feedPath(locale: Locale): string {
  return `${ROUTES.guides[locale]}/rss.xml`
}
