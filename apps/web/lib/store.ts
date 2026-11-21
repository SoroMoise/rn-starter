import { HTML_LANG, type Locale } from './i18n'
import type { RouteKey } from './routes'
import { STORE_URL } from './site'

export type StorePlacement =
  | 'header'
  | 'menu'
  | 'hero'
  | 'inline'
  | 'aside'
  | 'pricing'
  | 'band'
  | 'footer'

export function storeUrl({
  locale,
  route,
  placement,
}: {
  locale: Locale
  route: RouteKey
  placement: StorePlacement
}): string {
  const referrer = new URLSearchParams({
    utm_source: 'website',
    utm_medium: placement,
    utm_campaign: route,
    utm_content: locale,
  }).toString()
  return `${STORE_URL}&hl=${HTML_LANG[locale]}&referrer=${encodeURIComponent(referrer)}`
}
