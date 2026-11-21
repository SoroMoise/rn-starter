import type { Locale } from './i18n'
import { ROUTES, type RouteKey } from './routes'
import { SITE } from './site'

export function absoluteUrl(path: string): string {
  return path === '/' ? SITE.url : `${SITE.url}${path}`
}

export function pageUrl({ route, locale }: { route: RouteKey; locale: Locale }): string {
  return absoluteUrl(ROUTES[route][locale])
}

export function ogImagePath({ route, locale }: { route: RouteKey; locale: Locale }): string {
  return `/og/${locale}-${route}.png`
}
